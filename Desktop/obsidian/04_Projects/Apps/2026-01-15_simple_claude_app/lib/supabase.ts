
import { createClient } from '@supabase/supabase-js'

// クライアント側でもサーバー側でも使えるように環境変数を読み込む
// NEXT_PUBLIC_ をプレフィックスにすることでクライアントサイドにも公開されるが
// 今回はAPIルート(サーバーサイド)で使うため、Service Role Keyを使うなら公開してはいけない。
// しかし、既存の HANDOVER ドキュメントによると Anon Key を使っているようなので、
// 標準的な NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を想定する。

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
