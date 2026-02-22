import express from 'express';
import {
  getAllPlayers,
  getAllTeams,
  getTeamById,
  getNextPlayerForAuction,
  getAuctionSummary,
  markPlayerUnsold,
  markAllPlayersUnsold,
  searchPlayersForAuction,
  sellPlayer,
  exchangePlayersHandler,
  addPlayerHandler,
  updatePlayerHandler,
  deletePlayerHandler,
  createTeam,
  updateTeamHandler,
  deleteTeamHandler,
  getAuctionSettingsHandler,
  updateAuctionSettingsHandler,
} from '../controller/auction.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/players', getAllPlayers);
router.post('/players', authMiddleware, addPlayerHandler);
router.put('/players/sell',authMiddleware, sellPlayer);
router.post('/players/exchange', authMiddleware, exchangePlayersHandler);
router.put('/players/unsold-all',authMiddleware, markAllPlayersUnsold);
router.put('/players/:id/unsold',authMiddleware, markPlayerUnsold);
router.put('/players/:id', authMiddleware, updatePlayerHandler);
router.delete('/players/:id', authMiddleware, deletePlayerHandler);
router.get('/teams', getAllTeams);
router.get('/teams/:id', getTeamById);
router.put('/teams/:id', authMiddleware, updateTeamHandler);
router.delete('/teams/:id', authMiddleware, deleteTeamHandler);
router.get('/settings', getAuctionSettingsHandler);
router.put('/settings', authMiddleware, updateAuctionSettingsHandler);
router.get('/next-player',authMiddleware, getNextPlayerForAuction);
router.get('/summary',authMiddleware, getAuctionSummary);
router.get('/search', authMiddleware, searchPlayersForAuction);
router.post('/teams',authMiddleware, createTeam);

export default router;
