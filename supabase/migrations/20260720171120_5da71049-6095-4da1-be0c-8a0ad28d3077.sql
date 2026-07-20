
-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('director', 'designer', 'editor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto profile + first user becomes director
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)));

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'director');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'designer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enums
CREATE TYPE public.project_discipline AS ENUM ('designer', 'editor');
CREATE TYPE public.project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE public.stage_status AS ENUM ('locked', 'active', 'in_review', 'approved', 'revision', 'rejected');
CREATE TYPE public.review_action AS ENUM ('approve', 'reject', 'revision', 'comment');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  brand text,
  campaign text,
  platform text,
  deliverables text[] DEFAULT '{}',
  deadline date,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  objective text,
  audience text,
  brief text,
  notes text,
  discipline public.project_discipline NOT NULL,
  status public.project_status NOT NULL DEFAULT 'active',
  current_stage_order int NOT NULL DEFAULT 1,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "directors see all projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'director'));
CREATE POLICY "assignees see their projects" ON public.projects FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "directors create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "directors update projects" ON public.projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'director'));
CREATE POLICY "assignees update their projects" ON public.projects FOR UPDATE TO authenticated USING (assigned_to = auth.uid());

-- Stages
CREATE TABLE public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  title text NOT NULL,
  description text,
  time_estimate text,
  common_mistakes text[] DEFAULT '{}',
  senior_tips text[] DEFAULT '{}',
  stage_order int NOT NULL,
  status public.stage_status NOT NULL DEFAULT 'locked',
  submission_notes text,
  started_at timestamptz,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, stage_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_stages TO authenticated;
GRANT ALL ON public.project_stages TO service_role;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stages visible via project access" ON public.project_stages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid() OR p.created_by = auth.uid()))
);
CREATE POLICY "stages writeable via project access" ON public.project_stages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid()))
);
CREATE POLICY "directors insert stages" ON public.project_stages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Checklist
CREATE TABLE public.stage_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  item_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_checklist_items TO authenticated;
GRANT ALL ON public.stage_checklist_items TO service_role;
ALTER TABLE public.stage_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist visible via stage" ON public.stage_checklist_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.project_stages s JOIN public.projects p ON p.id = s.project_id
          WHERE s.id = stage_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid() OR p.created_by = auth.uid()))
);
CREATE POLICY "checklist writeable via stage" ON public.stage_checklist_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.project_stages s JOIN public.projects p ON p.id = s.project_id
          WHERE s.id = stage_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid()))
);
CREATE POLICY "checklist insertable via stage" ON public.stage_checklist_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.project_stages s JOIN public.projects p ON p.id = s.project_id
          WHERE s.id = stage_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid()))
);

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  action public.review_action NOT NULL,
  comment text,
  priority public.priority_level DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews visible via stage" ON public.reviews FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.project_stages s JOIN public.projects p ON p.id = s.project_id
          WHERE s.id = stage_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid() OR p.created_by = auth.uid()))
);
CREATE POLICY "directors create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'director') AND reviewer_id = auth.uid()
);
CREATE POLICY "assignees comment" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  action = 'comment' AND reviewer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.project_stages s JOIN public.projects p ON p.id = s.project_id
    WHERE s.id = stage_id AND p.assigned_to = auth.uid()
  )
);

-- AI briefs
CREATE TABLE public.ai_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  summary text,
  risks text[] DEFAULT '{}',
  questions text[] DEFAULT '{}',
  suggested_timeline text,
  suggested_workflow text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_briefs TO authenticated;
GRANT ALL ON public.ai_briefs TO service_role;
ALTER TABLE public.ai_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai briefs visible via project" ON public.ai_briefs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (public.has_role(auth.uid(),'director') OR p.assigned_to = auth.uid() OR p.created_by = auth.uid()))
);
CREATE POLICY "directors write ai briefs" ON public.ai_briefs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "directors update ai briefs" ON public.ai_briefs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'director'));

-- updated_at trigger for projects
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER projects_touch_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
