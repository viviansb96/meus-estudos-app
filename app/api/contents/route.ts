import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Content from '@/models/Content';
import Category from '@/models/Category';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, categoryName, status, investment, startDate, certificationDate, expirationDate, manualHours } = body;

    await connectDB();

    // 1. Verifica se a categoria existe. Se não, cria uma nova.
    let category = await Category.findOne({ name: categoryName, userId });
    if (!category) {
      category = await Category.create({ name: categoryName, userId });
    }

    // 2. Prepara os dados para salvar
    const newContent = await Content.create({
        name,
        categoryId: category._id,
        userId,
        investment: Number(investment) || 0,
        manualHours: Number(manualHours) || 0, // <--- ADICIONE ESTA LINHA AQUI
        startDate: startDate ? new Date(startDate) : new Date(),
        certificationDate: certificationDate ? new Date(certificationDate) : undefined,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
    });

    return NextResponse.json({ success: true, content: newContent }, { status: 201 });
    
  } catch (error) {
    console.error("Erro ao salvar conteúdo:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

// ... (mantenha o código da função POST que já está aí)

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    // Busca todos os conteúdos do usuário, ordenados do mais recente para o mais antigo,
    // e usa o .populate para trazer o 'name' da categoria associada.
    const contents = await Content.find({ userId })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ contents }, { status: 200 });
    
  } catch (error) {
    console.error("Erro ao buscar conteúdos:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, name, categoryName, status, investment, startDate, endDate, certificationDate, expirationDate, manualHours } = body;

    await connectDB();

    // Lida com a categoria personalizada
    let category = await Category.findOne({ name: categoryName, userId });
    if (!category) {
      category = await Category.create({ name: categoryName, userId });
    }

    // Atualiza o registro
    const updatedContent = await Content.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        categoryId: category._id,
        status,
        investment: Number(investment) || 0,
        manualHours: Number(manualHours) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        certificationDate: certificationDate ? new Date(certificationDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
      { new: true } // Retorna o documento atualizado
    );

    return NextResponse.json({ success: true, content: updatedContent }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar conteúdo:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Pega o ID que vem na URL (ex: /api/contents?id=123)
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID ausente' }, { status: 400 });

    await connectDB();
    
    // Procura o registro pelo ID e deleta
    await Content.findOneAndDelete({ _id: id, userId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar conteúdo:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}