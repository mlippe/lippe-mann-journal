'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  FINGERPRINT: 'lm_journal_fingerprint',
  USERNAME: 'lm_journal_username',
};

const RANDOM_ADJECTIVES = ['Sonniger', 'Wilder', 'Goldener', 'Stiller', 'Bunter', 'Abenteuerlicher'];
const RANDOM_NOUNS = ['Entdecker', 'Reisender', 'Beobachter', 'Künstler', 'Wanderer', 'Fotograf'];

const generateRandomUsername = () => {
  const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
  const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj} ${noun} ${num}`;
};

export const useIdentity = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Fingerprint
    let storedFingerprint = localStorage.getItem(STORAGE_KEYS.FINGERPRINT);
    if (!storedFingerprint) {
      storedFingerprint = uuidv4();
      localStorage.setItem(STORAGE_KEYS.FINGERPRINT, storedFingerprint);
    }
    setFingerprint(storedFingerprint);

    // Username
    let storedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (!storedUsername) {
      storedUsername = generateRandomUsername();
      localStorage.setItem(STORAGE_KEYS.USERNAME, storedUsername);
    }
    setUsername(storedUsername);
  }, []);

  const updateUsername = (newName: string) => {
    localStorage.setItem(STORAGE_KEYS.USERNAME, newName);
    setUsername(newName);
  };

  return {
    fingerprint,
    username,
    updateUsername,
    isLoaded: !!fingerprint && !!username,
  };
};
