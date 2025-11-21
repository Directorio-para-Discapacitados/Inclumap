// src/pages/reviews/reviewService.ts
import { api } from "../../config/api";

export const getBusinessReviews = async (businessId: string | number) => {
  try {
    const res = await api.get(`/reviews/business/${businessId}`);
    return res.data || [];
  } catch {
    return [];
  }
};

export const createReview = async ({
  rating,
  comment,
  business_id,
  token,
}: {
  rating: number;
  comment: string;
  business_id: number;
  token: string;
}) => {
  const res = await api.post(
    "/reviews",
    { rating, comment, business_id },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const updateReview = async (
  reviewId: number,
  {
    rating,
    comment,
    token,
  }: { rating: number; comment: string; token: string }
) => {
  const res = await api.patch(
    `/reviews/${reviewId}`,
    { rating, comment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const deleteReview = async (reviewId: number, token: string) => {
  const res = await api.delete(`/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const setOwnerReply = async (
  reviewId: number,
  owner_reply: string,
  token: string,
) => {
  const res = await api.patch(
    `/reviews/${reviewId}/owner-reply`,
    { owner_reply },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};
