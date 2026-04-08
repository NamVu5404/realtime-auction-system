import DEFAULT_IMAGE_LOCAL from "../assets/images/default-auction-image.jpg";
import { ENV } from "../config/env";

/**
 * Image Utility Functions
 */

// Base URL for images served by the backend (includes context-path /api)
export const API_IMAGE_BASE = ENV.IMAGE_BASE_URL;

/**
 * Placeholder image for auctions
 */
export const DEFAULT_AUCTION_IMAGE = DEFAULT_IMAGE_LOCAL;

/**
 * Construct full image URL from relative path or file object
 * @param pathOrFile Relative path string or object with filePath and storageName
 * @returns Full URL or undefined
 */
export const getImageUrl = (
  pathOrFile?: string | { filePath: string; storageName: string } | null,
): string => {
  if (!pathOrFile) return DEFAULT_AUCTION_IMAGE;

  let path: string;
  if (typeof pathOrFile === "string") {
    path = pathOrFile;
  } else {
    // Handle FileResponse objects
    path = `${pathOrFile.filePath}/${pathOrFile.storageName}`;
  }

  if (path.startsWith("http")) return path;
  if (path.includes("placeholder")) return DEFAULT_AUCTION_IMAGE;

  // Ensure we don't have double slashes
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${API_IMAGE_BASE}/${cleanPath}`;
};

/**
 * Construct full avatar URL from relative path
 * Return undefined if none is provided, allowing antd Avatar to fallback to icon
 */
export const getAvatarUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${API_IMAGE_BASE}/avatars/${cleanPath}`;
};
