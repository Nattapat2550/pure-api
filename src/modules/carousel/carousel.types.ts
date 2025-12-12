export type CarouselItem = {
  id: number;
  item_index: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_dataurl: string;
  created_at: string;
  updated_at: string;
};

export type UpsertCarouselBody = {
  item_index?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  image_dataurl?: string;
};
