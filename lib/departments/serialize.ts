import type { Department } from "@/lib/db/types"

type DepartmentRecord = {
  id: string
  branchId: string
  name: string
  createdAt: Date
  updatedAt: Date
  _count?: { members: number }
}

export function serializeDepartment(item: DepartmentRecord): Department {
  return {
    id: item.id,
    branchId: item.branchId,
    name: item.name,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    memberCount: item._count?.members ?? 0,
  }
}
