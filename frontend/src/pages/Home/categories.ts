import type { CatalogParams } from '../../services/api';

export interface CategoryConfig {
  title: string;
  params: CatalogParams;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    title: 'Популярные новинки',
    params: { order: 'popularity', status: 'ongoing', score: '6' },
  },
  {
    title: 'Шедевры на все времена',
    params: { order: 'ranked', score: '8' },
  },
  {
    title: 'Лучшие фильмы',
    params: { kind: 'movie', order: 'popularity', score: '7' },
  },
  {
    title: 'Захватывающий экшен',
    params: { genre: '1', order: 'popularity', score: '7' },
  },
  {
    title: 'Комедии на вечер',
    params: { genre: '4', order: 'popularity', score: '7' },
  },
  {
    title: 'Романтика',
    params: { genre: '22', order: 'popularity', score: '7' },
  },
  {
    title: 'Фантастика',
    params: { genre: '24', order: 'popularity', score: '7' },
  },
  {
    title: 'Фэнтези миры',
    params: { genre: '10', order: 'popularity', score: '7' },
  },
  {
    title: 'Исекай',
    params: { genre: '62', order: 'popularity', score: '7' },
  },
  {
    title: 'Школьная жизнь',
    params: { genre: '23', order: 'popularity', score: '7' },
  },
  {
    title: 'Повседневность',
    params: { genre: '36', order: 'popularity', score: '7' },
  },
  {
    title: 'Психология и триллеры',
    params: { genre: '40,41', order: 'popularity', score: '7' },
  },
  {
    title: 'Спортивные достижения',
    params: { genre: '30', order: 'popularity', score: '7' },
  },
  {
    title: 'Детективы',
    params: { genre: '7', order: 'popularity', score: '7' },
  },
  {
    title: 'Трогательные драмы',
    params: { genre: '8', order: 'popularity', score: '7' },
  },
  {
    title: 'Случайные находки',
    params: { order: 'random', score: '7' },
  },
  {
    title: 'Меха',
    params: { genre: '18', order: 'popularity', score: '7' },
  },
  {
    title: 'Пугающие ужасы',
    params: { genre: '14', order: 'popularity', score: '6' },
  },
  {
    title: 'Классика 2000-х',
    params: { season: '2000_2009', order: 'popularity', score: '7' },
  },
  {
    title: 'Легенды 2010-х',
    params: { season: '2010_2019', order: 'popularity', score: '7' },
  },
];
