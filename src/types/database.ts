export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          selling_price: number
          product_cost: number
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          selling_price?: number
          product_cost?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          selling_price?: number
          product_cost?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          id: string
          user_id: string
          name: string
          purchase_price: number
          purchase_quantity: number
          unit: string
          cost_per_unit: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          purchase_price: number
          purchase_quantity: number
          unit: string
          cost_per_unit: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          purchase_price?: number
          purchase_quantity?: number
          unit?: string
          cost_per_unit?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_ingredients: {
        Row: {
          id: string
          user_id: string
          product_id: string
          ingredient_id: string
          quantity_used: number
          ingredient_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          ingredient_id: string
          quantity_used: number
          ingredient_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          ingredient_id?: string
          quantity_used?: number
          ingredient_cost?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_ingredients_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_ingredients_ingredient_id_fkey'
            columns: ['ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
        ]
      }
      income_transactions: {
        Row: {
          id: string
          user_id: string
          sale_date: string
          product_id: string
          quantity: number
          price_per_item: number
          total_income: number
          estimated_cost: number
          estimated_profit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sale_date: string
          product_id: string
          quantity: number
          price_per_item: number
          total_income: number
          estimated_cost: number
          estimated_profit: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sale_date?: string
          product_id?: string
          quantity?: number
          price_per_item?: number
          total_income?: number
          estimated_cost?: number
          estimated_profit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'income_transactions_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      expense_transactions: {
        Row: {
          id: string
          user_id: string
          expense_date: string
          category: string
          title: string
          amount: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expense_date: string
          category: string
          title: string
          amount: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expense_date?: string
          category?: string
          title?: string
          amount?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Product = Tables<'products'>
export type Ingredient = Tables<'ingredients'>
export type ProductIngredient = Tables<'product_ingredients'>
export type IncomeTransaction = Tables<'income_transactions'>
export type ExpenseTransaction = Tables<'expense_transactions'>
