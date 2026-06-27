import { NextResponse } from 'next/server';

export const success = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status });

export const failure = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export const validationError = (details: { field: string; message: string }[]) =>
  NextResponse.json({ error: 'Validation failed', details }, { status: 422 });