import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import StudySession from '@/models/StudySession';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await connectDB();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let startDate: Date;
    let endDate: Date;
    let label = '';

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    if (currentDay <= 15) {
      startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth, 15, 23, 59, 59);
      label = `1ª Quinzena de ${monthNames[currentMonth]}`;
    } else {
      startDate = new Date(currentYear, currentMonth, 16, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      label = `2ª Quinzena de ${monthNames[currentMonth]}`;
    }

    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // BUSCA USUÁRIOS E FOTOS NO CLERK
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({ limit: 100 });
    const userMap = new Map<string, { name: string; image: string }>();
    
    clerkUsersResponse.data.forEach((u) => {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
      userMap.set(u.id, {
        name: fullName || 'Especialista Anônimo',
        image: u.imageUrl || '' // Puxa a foto do perfil oficial!
      });
    });

    const allSessions = await StudySession.find({}, 'userId createdAt').lean();
    const userDates = new Map<string, Set<string>>();
    
    allSessions.forEach(session => {
      const uId = session.userId.toString();
      const dateStr = new Date(session.createdAt).toLocaleDateString('en-CA'); 
      if (!userDates.has(uId)) userDates.set(uId, new Set());
      userDates.get(uId)?.add(dateStr);
    });

    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');
    const userStreaks = new Map<string, number>();

    userDates.forEach((dates, uId) => {
      let streak = 0;
      let checkDate = new Date();
      const hasToday = dates.has(todayStr);
      const hasYesterday = dates.has(yesterdayStr);

      if (hasToday || hasYesterday) {
        while (true) {
          const dStr = checkDate.toLocaleDateString('en-CA');
          if (dates.has(dStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (dStr === todayStr && !hasToday) {
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      userStreaks.set(uId, streak);
    });

    const sessionsAggregate = await StudySession.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$userId', totalSeconds: { $sum: '$durationInSeconds' } } },
      { $sort: { totalSeconds: -1 } }
    ]);

    const leaderboard = sessionsAggregate.map((item, index) => {
      const userData = userMap.get(item._id) || { name: 'Membro do Time', image: '' };
      return { 
        rank: index + 1, 
        name: userData.name, 
        imageUrl: userData.image, // Injeta a imagem no ranking
        hours: Number((item.totalSeconds / 3600).toFixed(1)), 
        streak: userStreaks.get(item._id) || 0 
      };
    });

    clerkUsersResponse.data.forEach((u) => {
      const alreadyInList = leaderboard.some(item => (userMap.get(u.id)?.name || '') === item.name);
      if (!alreadyInList) {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
        leaderboard.push({
          rank: leaderboard.length + 1,
          name: fullName || 'Membro do Time',
          imageUrl: u.imageUrl || '',
          hours: 0,
          streak: userStreaks.get(u.id) || 0
        });
      }
    });

    leaderboard.sort((a, b) => b.hours - a.hours);
    leaderboard.forEach((item, index) => item.rank = index + 1);

    // RELATÓRIO ANTERIOR
    let lastStartDate: Date;
    let lastEndDate: Date;
    let lastLabel = '';

    if (currentDay <= 15) {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      lastLabel = `2ª Quinzena de ${monthNames[prevMonth]}`;
      lastStartDate = new Date(prevYear, prevMonth, 16, 0, 0, 0);
      lastEndDate = new Date(prevYear, currentMonth, 0, 23, 59, 59);
    } else {
      lastLabel = `1ª Quinzena de ${monthNames[currentMonth]}`;
      lastStartDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      lastEndDate = new Date(currentYear, currentMonth, 15, 23, 59, 59);
    }

    const pastSessionsAggregate = await StudySession.aggregate([
      { $match: { createdAt: { $gte: lastStartDate, $lte: lastEndDate } } },
      { $group: { _id: '$userId', totalSeconds: { $sum: '$durationInSeconds' } } },
      { $sort: { totalSeconds: -1 } }
    ]);

    const pastStandings = pastSessionsAggregate.map((item, index) => ({
      rank: index + 1,
      name: userMap.get(item._id)?.name || 'Membro do Time',
      hours: Number((item.totalSeconds / 3600).toFixed(1))
    }));

    return NextResponse.json({
      fortnightInfo: { label, daysLeft },
      leaderboard,
      lastFortnightReport: pastStandings.length > 0 ? { label: lastLabel, winner: pastStandings[0].name, standings: pastStandings } : null
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}