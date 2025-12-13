import { NextResponse } from 'next/server'
import { MOCK_GLOSSARY_TERMS } from '@/lib/mock-data'

// FAZA 1: Wersja bez bazy danych - używa tylko mock data
export async function GET() {
  try {
    // W fazie 1 zwracamy tylko mock data
    return NextResponse.json({ terms: MOCK_GLOSSARY_TERMS })
  } catch (error) {
    console.error('Glossary fetch error:', error)
    return NextResponse.json({ terms: MOCK_GLOSSARY_TERMS })
  }
}

