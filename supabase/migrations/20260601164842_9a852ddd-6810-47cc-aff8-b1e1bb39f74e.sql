-- Ensure unique user_id constraint
ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);

-- Atomic credit check (no deduction). Auto-provisions row with default 5 credits.
CREATE OR REPLACE FUNCTION public.check_user_credits(_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _remaining int;
BEGIN
  SELECT credits_remaining INTO _remaining FROM public.user_credits WHERE user_id = _user_id;
  IF _remaining IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits_remaining) VALUES (_user_id, 5)
      RETURNING credits_remaining INTO _remaining;
  END IF;
  RETURN COALESCE(_remaining, 0);
END;
$$;

-- Atomic deduction: succeeds only if balance >= amount. Returns new balance, or -1 if insufficient.
CREATE OR REPLACE FUNCTION public.deduct_user_credit(_user_id uuid, _amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _remaining int;
BEGIN
  -- Auto-provision row on first use
  INSERT INTO public.user_credits (user_id, credits_remaining)
    VALUES (_user_id, 5)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
  SET credits_remaining = credits_remaining - _amount,
      total_ai_calls = COALESCE(total_ai_calls, 0) + 1,
      daily_ai_calls = COALESCE(daily_ai_calls, 0) + 1,
      updated_at = now()
  WHERE user_id = _user_id AND credits_remaining >= _amount
  RETURNING credits_remaining INTO _remaining;

  IF _remaining IS NULL THEN
    RETURN -1;
  END IF;
  RETURN _remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_credits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_user_credit(uuid, int) TO authenticated, service_role;