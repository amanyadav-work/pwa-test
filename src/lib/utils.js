import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}



export function getInitials(name) {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Single name: use first two letters
    return (words[0][0] + (words[0][1] || words[0][0])).toUpperCase();
  } else {
    // Multiple words: first letter + last word's first letter
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
}


export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);  // base64 string including prefix e.g. "data:image/png;base64,iVBORw0..."
    };

    reader.onerror = error => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}
