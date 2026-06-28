'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/auth-slice';

interface Props {
  user: { id: string; email: string; name: string };
}

export default function AuthHydrator({ user }: Props) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setUser(user));
  }, [dispatch, user]);
  return null;
}
