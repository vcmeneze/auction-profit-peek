import { createClient } from '@supabase/supabase-js';

// Substitua pelas chaves reais do seu painel do Supabase (Project Settings > API)
const supabaseUrl = 'https://jdnkafyjswalfegjhfcw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmthZnlqc3dhbGZlZ2poZmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU4MjIsImV4cCI6MjEwNjk4MTgyMn0.GJnHG-qEMaFJ59IAMSE_tUGUW21ahOdXWLsMvSzL_Ls';

export const supabase = createClient(supabaseUrl, supabaseKey);