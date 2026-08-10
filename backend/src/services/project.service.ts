import { getAdminClient, assertNoDbError, rowToCamel, rowsToCamel } from '../config/supabase';
import { CompanyService } from './company.service';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.validator';
import { ForbiddenError, NotFoundError, AppError } from '../utils/errors';

// ─── Project Service ──────────────────────────────────────────────────────────
// All methods:
//  1. Look up the user's company + verify it is a CUSTOMER company
//  2. Enforce ownership — never trust companyId from the request body
//  3. Use the admin client for DB operations (backend enforces authorization)

async function requireCustomerContext(userId: string) {
  const ctx = await CompanyService.getCompanyContext(userId);
  if (!ctx) {
    throw new AppError('NO_COMPANY', 'No company found. Please complete company setup.', 404);
  }
  if (ctx.companyType !== 'CUSTOMER') {
    throw new ForbiddenError('Projects are only available for Customer accounts');
  }
  return ctx;
}

export const ProjectService = {
  // ── List projects ──────────────────────────────────────────────────────────

  async listProjects(userId: string) {
    const ctx = await requireCustomerContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('customer_projects')
      .select('*')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    assertNoDbError(error, 'Projects list');
    return rowsToCamel(data as Record<string, unknown>[]);
  },

  // ── Create project ─────────────────────────────────────────────────────────

  async createProject(userId: string, input: CreateProjectInput) {
    const ctx = await requireCustomerContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('customer_projects')
      .insert({
        company_id:        ctx.companyId,
        name:              input.name,
        description:       input.description,
        location:          input.location,
        status:            input.status,
        start_date:        input.start_date,
        expected_end_date: input.expected_end_date,
      })
      .select()
      .single();

    assertNoDbError(error, 'Project create');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── Get single project ─────────────────────────────────────────────────────

  async getProject(userId: string, projectId: string) {
    const ctx = await requireCustomerContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('customer_projects')
      .select('*')
      .eq('id', projectId)
      .eq('company_id', ctx.companyId)  // enforces ownership
      .maybeSingle();

    assertNoDbError(error, 'Project fetch');
    if (!data) throw new NotFoundError('Project');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── Update project ─────────────────────────────────────────────────────────

  async updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
    const ctx = await requireCustomerContext(userId);
    const db = getAdminClient();

    // Verify ownership before updating
    const { data: existing } = await db
      .from('customer_projects')
      .select('id')
      .eq('id', projectId)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Project');

    const { data, error } = await db
      .from('customer_projects')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('company_id', ctx.companyId)
      .select()
      .single();

    assertNoDbError(error, 'Project update');
    return rowToCamel(data as Record<string, unknown>);
  },

  // ── Archive project (soft delete via status) ───────────────────────────────

  async archiveProject(userId: string, projectId: string) {
    return ProjectService.updateProject(userId, projectId, { status: 'ARCHIVED' });
  },

  // ── Delete project (hard delete) ───────────────────────────────────────────

  async deleteProject(userId: string, projectId: string) {
    const ctx = await requireCustomerContext(userId);
    const db = getAdminClient();

    const { data: existing } = await db
      .from('customer_projects')
      .select('id')
      .eq('id', projectId)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Project');

    const { error } = await db
      .from('customer_projects')
      .delete()
      .eq('id', projectId)
      .eq('company_id', ctx.companyId);

    assertNoDbError(error, 'Project delete');
    return { deleted: true };
  },

  // ── Summary stats ──────────────────────────────────────────────────────────

  async getProjectStats(userId: string) {
    const ctx = await requireCustomerContext(userId);
    const db = getAdminClient();

    const { data, error } = await db
      .from('customer_projects')
      .select('status')
      .eq('company_id', ctx.companyId);

    assertNoDbError(error, 'Project stats');

    const projects = (data as { status: string }[]) ?? [];
    return {
      total:     projects.length,
      draft:     projects.filter((p) => p.status === 'DRAFT').length,
      active:    projects.filter((p) => p.status === 'ACTIVE').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      archived:  projects.filter((p) => p.status === 'ARCHIVED').length,
    };
  },
};
