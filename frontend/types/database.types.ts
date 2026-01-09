// Tipos do banco de dados serão gerados aqui
// Por enquanto, tipos básicos

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tipos serão adicionados conforme criamos as tabelas
    }
  }
}

