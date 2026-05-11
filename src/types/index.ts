export type TableType = 'Main' | 'Women' | 'Men'

export interface Table {
  id: string
  table_number: number
  table_type: TableType
  capacity_limit: number
  guests?: Guest[]
}

export interface Guest {
  id: string
  full_name: string
  category: string
  side: TableType
  table_id: string | null
  created_at: string
}

export interface GuestsByCategory {
  [category: string]: Guest[]
}
