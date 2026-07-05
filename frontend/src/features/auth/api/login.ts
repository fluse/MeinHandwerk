import { pb } from '@/core/api/pocketbase'
import type { LoginInput } from '../types/schema'

export async function login({ email, password }: LoginInput) {
  return pb.collection('users').authWithPassword(email, password)
}
