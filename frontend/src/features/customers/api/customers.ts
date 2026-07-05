import type { RecordModel } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import type { Customer, CustomerFormInput } from '../types/customer'

function toCustomer(r: RecordModel): Customer {
  return {
    id: r.id,
    kdnr: r.kdnr ?? '',
    name: r.name ?? '',
    contact: r.contact ?? '',
    street: r.street ?? '',
    zip: r.zip ?? '',
    city: r.city ?? '',
    phone: r.phone ?? '',
    email: r.email ?? '',
    notes: r.notes ?? '',
  }
}

export async function listCustomers(): Promise<Customer[]> {
  const records = await pb.collection('customers').getFullList({ sort: 'name' })
  return records.map(toCustomer)
}

export async function getCustomer(id: string): Promise<Customer> {
  return toCustomer(await pb.collection('customers').getOne(id))
}

function toPayload(input: CustomerFormInput) {
  return {
    kdnr: input.kdnr ?? '',
    name: input.name ?? '',
    contact: input.contact ?? '',
    street: input.street ?? '',
    zip: input.zip ?? '',
    city: input.city ?? '',
    phone: input.phone ?? '',
    email: input.email ?? '',
    notes: input.notes ?? '',
  }
}

export async function createCustomer(input: CustomerFormInput): Promise<Customer> {
  return toCustomer(await pb.collection('customers').create(toPayload(input)))
}

export async function updateCustomer(id: string, input: CustomerFormInput): Promise<Customer> {
  return toCustomer(await pb.collection('customers').update(id, toPayload(input)))
}

export async function deleteCustomer(id: string): Promise<void> {
  await pb.collection('customers').delete(id)
}
