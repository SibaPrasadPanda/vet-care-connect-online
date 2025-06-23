-- Migration to add user_profiles and pets tables

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  email text,
  phone text,
  address text,
  emergency_contact text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.user_profiles(id),
  name text NOT NULL,
  species text,
  breed text,
  age integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
