'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  FINGERPRINT: 'lm_journal_fingerprint',
  USERNAME: 'lm_journal_username',
};

const RANDOM_ADJECTIVES = [
  'Caffeinated', 'Baffled', 'Global', 'Nomadic', 'Spicy', 'Clumsy', 'Sassy', 'Zen', 
  'Hyperactive', 'Grumpy', 'Majestic', 'Funky', 'Wobbly', 'Electric', 'Shady', 'Fancy', 
  'Crispy', 'Dizzy', 'Stealthy', 'Glittery', 'Salty', 'Cosmic', 'Vintage', 'Sonic', 
  'Cheeky', 'Rusty', 'Fluffy', 'Gritty', 'Puffy', 'Sneaky', 'Turbo', 'Glitched', 
  'Radiant', 'Vexed', 'Lo-fi'
];

const RANDOM_NOUNS = [
  'Explorer', 'Voyager', 'Artist', 'Legend', 'Potato', 'Ninja', 'Panda', 'Llama', 
  'Captain', 'Wizard', 'Sloth', 'Burrito', 'Unicorn', 'Cactus', 'Pickle', 'Raccoon', 
  'Viking', 'Astronaut', 'Goblin', 'Dino', 'Wombat', 'Octopus', 'Badger', 'Yeti', 
  'Cyborg', 'Ghost', 'Taco', 'Muffin', 'Penguin', 'Hamster', 'Sasquatch', 'Kangaroo', 
  'Capybara', 'Axolotl', 'Narwhal'
];

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
