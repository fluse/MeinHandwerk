import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { Project, ProjectFormInput, ProjectStatus } from '../types/project'

function toProject(r: RecordModel): Project {
  return {
    id: r.id,
    projnr: r.projnr ?? '',
    title: r.title ?? '',
    client: r.client ?? '',
    street: r.street ?? '',
    zip: r.zip ?? '',
    city: r.city ?? '',
    phone: r.phone ?? '',
    value: typeof r.value === 'number' ? r.value : null,
    date: r.date ?? '',
    desc: r.desc ?? '',
    status: r.status,
    scheduledOrder: r.scheduledOrder ?? '',
  }
}

function parseValue(raw?: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function toPayload(input: ProjectFormInput) {
  return {
    projnr: input.projnr ?? '',
    title: input.title,
    client: input.client ?? '',
    street: input.street ?? '',
    zip: input.zip ?? '',
    city: input.city ?? '',
    phone: input.phone ?? '',
    value: parseValue(input.value),
    date: input.date ?? '',
    desc: input.desc ?? '',
    status: input.status,
  }
}

export async function listProjects(): Promise<Project[]> {
  const records = await pb.collection('projects').getFullList({ sort: 'title' })
  return records.map(toProject)
}

export async function getProject(id: string): Promise<Project> {
  return toProject(await pb.collection('projects').getOne(id))
}

export async function createProject(input: ProjectFormInput): Promise<Project> {
  return toProject(await pb.collection('projects').create(toPayload(input)))
}

export async function updateProject(id: string, input: ProjectFormInput): Promise<Project> {
  return toProject(await pb.collection('projects').update(id, toPayload(input)))
}

export async function deleteProject(id: string): Promise<void> {
  await pb.collection('projects').delete(id)
}

export async function setProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
  return toProject(await pb.collection('projects').update(id, { status }))
}
