import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { CreateMemberInput, EditMemberInput, TeamMember } from '../types/member'

function toMember(record: RecordModel): TeamMember {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    phone: record.phone ?? '',
  }
}

export async function listTeam(): Promise<TeamMember[]> {
  const records = await pb.collection('users').getFullList({ sort: 'name' })
  return records.map(toMember)
}

export async function createMember(input: CreateMemberInput): Promise<TeamMember> {
  const record = await pb.collection('users').create({
    name: input.name,
    email: input.email,
    password: input.password,
    passwordConfirm: input.password,
    role: input.role,
    phone: input.phone ?? '',
    emailVisibility: true,
  })
  return toMember(record)
}

export async function updateMember(id: string, input: EditMemberInput): Promise<TeamMember> {
  const record = await pb.collection('users').update(id, input)
  return toMember(record)
}

export async function deleteMember(id: string): Promise<void> {
  await pb.collection('users').delete(id)
}
