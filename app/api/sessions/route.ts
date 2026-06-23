import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Content from '@/models/Content';
import StudySession from '@/models/StudySession';

// === 1. MÉTODO POST (SALVAR SESSÃO) ===
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { taskName, durationInSeconds } = body;

    await connectDB();

    // Busca ou cria a categoria padrão do Timer
    let category = await Category.findOne({ name: 'Estudos Gerais', userId });
    if (!category) {
      category = await Category.create({ name: 'Estudos Gerais', userId });
    }

    // Busca ou cria o conteúdo associado (Ex: Zscaler ZTDE)
    let content = await Content.findOne({ name: taskName, userId });
    if (!content) {
      content = await Content.create({
        name: taskName,
        categoryId: category._id,
        userId,
        startDate: new Date(),
      });
    }

    // Cria a sessão de estudos vinculada ao conteúdo correto
    const session = await StudySession.create({
      userId,
      contentId: content._id,
      durationInSeconds,
    });

    // INTEGRADO: Converte segundos para horas e incrementa na página de Estudos
    const hoursToAdd = durationInSeconds / 3600;
    await Content.findByIdAndUpdate(
      content._id,
      { $inc: { manualHours: hoursToAdd } }
    );

    return NextResponse.json({ success: true, session }, { status: 201 });
    
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

// === 2. MÉTODO GET (CARREGAR NO DASHBOARD) ===
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    // Busca o histórico de sessões para alimentar o gráfico e calendário da Home
    const sessions = await StudySession.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}