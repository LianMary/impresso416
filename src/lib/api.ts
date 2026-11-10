import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories?: { name: string; slug: string } | null;
};
export type Category = Database["public"]["Tables"]["categories"]["Row"];

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data;
  },
});

export type ProductFilters = { q?: string; categoria?: string; ordem?: string };

export const productsQuery = (f: ProductFilters = {}) =>
  queryOptions({
    queryKey: ["products", f],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*, categories!inner(name, slug)")
        .eq("active", true);
      if (f.categoria) q = q.eq("categories.slug", f.categoria);
      if (f.q) q = q.ilike("name", `%${f.q}%`);
      if (f.ordem === "menor") q = q.order("price", { ascending: true });
      else if (f.ordem === "maior") q = q.order("price", { ascending: false });
      else if (f.ordem === "novos") q = q.order("created_at", { ascending: false });
      else q = q.order("featured", { ascending: false }).order("sales_count", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data as Product[];
    },
  });

export const featuredQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("active", true)
      .eq("featured", true)
      .limit(8);
    if (error) throw error;
    return data as Product[];
  },
});

export const newestQuery = queryOptions({
  queryKey: ["products", "newest"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(4);
    if (error) throw error;
    return data as Product[];
  },
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
