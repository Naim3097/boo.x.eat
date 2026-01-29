import { useState, useCallback } from 'react';
import { addToWaitlist, submitContactForm, ContactSubmission } from '../lib/supabase';

interface UseWaitlistReturn {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  subscribe: (email: string, source?: string) => Promise<void>;
  reset: () => void;
}

export function useWaitlist(): UseWaitlistReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (email: string, source: string = 'landing') => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await addToWaitlist(email, source);
      setIsSuccess(true);
    } catch (err: any) {
      if (err?.code === '23505') {
        setError('This email is already on the waitlist!');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return { isLoading, isSuccess, error, subscribe, reset };
}

interface UseContactFormReturn {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  submit: (data: Omit<ContactSubmission, 'id' | 'created_at'>) => Promise<void>;
  reset: () => void;
}

export function useContactForm(): UseContactFormReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: Omit<ContactSubmission, 'id' | 'created_at'>) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await submitContactForm(data);
      setIsSuccess(true);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return { isLoading, isSuccess, error, submit, reset };
}
