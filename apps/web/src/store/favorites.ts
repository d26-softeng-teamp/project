import { create } from "zustand";

type FavoriteStore = {
  favorites: Set<string>;
  toggle: (fileID: string) => void;
  setAll: (ids: string[]) => void;
  isFavorited: (fileID: string) => boolean;
};

export const useFavorites = create<FavoriteStore>((set, get) => ({
  favorites: new Set(),

  toggle: (fileID) => {
    const next = new Set(get().favorites);

    if (next.has(fileID)) next.delete(fileID);
    else next.add(fileID);

    set({ favorites: next });
  },

  setAll: (ids) => {
    set({ favorites: new Set(ids) });
  },

  isFavorited: (fileID) => {
    return get().favorites.has(fileID);
  },
}));
