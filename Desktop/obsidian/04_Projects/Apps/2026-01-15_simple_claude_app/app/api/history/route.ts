
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    try {
        const { data, error } = await supabase
            .from('Question')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
