import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';

// Use relative URLs in development to work with Vite proxy
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://serienapi.konrad-dinges.de/api');
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? '' : 'https://serienapi.konrad-dinges.de');

class ApiService {
  private api: AxiosInstance;
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only redirect to login if there's no token at all
        // Don't auto-logout on 401 if user has a token (might be a temporary network issue)
        if (error.response?.status === 401 && !this.getToken()) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  connectSocket(): void {
    const token = this.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  async register(email: string, password: string, username: string, displayName?: string) {
    const response = await this.api.post('/auth/register', {
      email,
      password,
      username,
      displayName,
    });
    this.setToken(response.data.token);
    this.connectSocket();
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    this.setToken(response.data.token);
    this.connectSocket();
    return response.data;
  }

  async logout() {
    await this.api.post('/auth/logout');
    this.clearToken();
    this.disconnectSocket();
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data.user;
  }

  async updateProfile(updates: any) {
    const response = await this.api.put('/auth/profile', updates);
    return response.data.user;
  }

  async getSeries(filters?: any) {
    const response = await this.api.get('/series', { params: filters });
    return response.data;
  }

  async getSeriesById(id: string) {
    const response = await this.api.get(`/series/${id}`);
    return response.data;
  }

  async addSeries(tmdbId: number, data?: any) {
    const response = await this.api.post('/series', { tmdbId, ...data });
    return response.data;
  }

  async updateSeries(id: string, updates: any) {
    // Use specific endpoint for watchlist updates
    if (updates.watchlist !== undefined && Object.keys(updates).length === 1) {
      const response = await this.api.put(`/series/${id}/watchlist`, updates);
      return response.data;
    }
    // Use general update endpoint for other updates
    const response = await this.api.put(`/series/${id}`, updates);
    return response.data;
  }

  async updateEpisode(seriesId: string, episodeData: any) {
    const response = await this.api.put(`/series/${seriesId}/episodes`, episodeData);
    return response.data;
  }

  async deleteSeries(id: string) {
    const response = await this.api.delete(`/series/${id}`);
    return response.data;
  }

  async getMovies(filters?: any) {
    const response = await this.api.get('/movies', { params: filters });
    return response.data;
  }

  async getMovieById(id: string) {
    const response = await this.api.get(`/movies/${id}`);
    return response.data;
  }

  async addMovie(tmdbId: number, data?: any) {
    const response = await this.api.post('/movies', { tmdbId, ...data });
    return response.data;
  }

  async updateMovie(id: string, updates: any) {
    const response = await this.api.put(`/movies/${id}`, updates);
    return response.data;
  }

  async deleteMovie(id: string) {
    const response = await this.api.delete(`/movies/${id}`);
    return response.data;
  }

  async getFriends() {
    const response = await this.api.get('/friends');
    return response.data;
  }

  async getFriendRequests() {
    const response = await this.api.get('/friends/requests');
    return response.data;
  }

  async sendFriendRequest(username: string, message?: string) {
    const response = await this.api.post('/friends/request', { username, message });
    return response.data;
  }

  async acceptFriendRequest(id: string) {
    const response = await this.api.put(`/friends/request/${id}/accept`);
    return response.data;
  }

  async declineFriendRequest(id: string) {
    const response = await this.api.put(`/friends/request/${id}/decline`);
    return response.data;
  }

  async removeFriend(friendId: string) {
    const response = await this.api.delete(`/friends/${friendId}`);
    return response.data;
  }

  async getActivities(limit = 20, offset = 0) {
    const response = await this.api.get('/activities', { params: { limit, offset } });
    return response.data;
  }

  async getUserActivities(userId: string, limit = 20, offset = 0) {
    const response = await this.api.get(`/activities/user/${userId}`, {
      params: { limit, offset },
    });
    return response.data;
  }

  async createActivity(type: string, data: any, visibility = 'friends') {
    const response = await this.api.post('/activities', { type, data, visibility });
    return response.data;
  }

  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.api.post('/upload/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadThemeImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.api.post('/upload/theme-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getStats() {
    const response = await this.api.get('/stats/overview');
    return response.data;
  }

  async getSeriesStats(period = 'month') {
    const response = await this.api.get('/stats/series', { params: { period } });
    return response.data;
  }

  async getMovieStats() {
    const response = await this.api.get('/stats/movies');
    return response.data;
  }

  async searchTMDBSeries(query: string, page = 1) {
    const response = await this.api.get('/tmdb/search/series', { params: { query, page } });
    return response.data;
  }

  async searchTMDBMovies(query: string, page = 1) {
    const response = await this.api.get('/tmdb/search/movies', { params: { query, page } });
    return response.data;
  }

  async getTMDBSeriesDetails(id: number) {
    const response = await this.api.get(`/tmdb/series/${id}`);
    return response.data;
  }

  async getTMDBMovieDetails(id: number) {
    const response = await this.api.get(`/tmdb/movie/${id}`);
    return response.data;
  }

  async searchUsers(query: string) {
    const response = await this.api.get('/users/search', { params: { q: query } });
    return response.data;
  }

  async getUserProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async getPublicProfile(username: string) {
    const response = await this.api.get(`/users/public/${username}`);
    return response.data;
  }

  async getUserSeries(userId: string) {
    const response = await this.api.get(`/series/user/${userId}`);
    return response.data;
  }

  async getUserMovies(userId: string) {
    const response = await this.api.get(`/movies/user/${userId}`);
    return response.data;
  }

  async updateSettings(settings: any) {
    const response = await this.api.put('/users/settings', settings);
    return response.data;
  }

  // Email verification methods
  async checkEmailVerification() {
    const response = await this.api.get('/auth/check-verification');
    return response.data.emailVerified;
  }

  async resendVerificationEmail() {
    const response = await this.api.post('/auth/resend-verification');
    return response.data;
  }

  // Notification methods
  async getNotifications() {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async createNotification(notification: any) {
    const response = await this.api.post('/notifications', notification);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }

  async clearNotifications() {
    const response = await this.api.delete('/notifications');
    return response.data;
  }

  // Activity notification methods
  async getUnreadActivities() {
    const response = await this.api.get('/activities/unread');
    return response.data;
  }

  async markActivitiesAsRead(friendId: string) {
    const response = await this.api.put(`/activities/read/${friendId}`);
    return response.data;
  }

  async markAllActivitiesAsRead() {
    const response = await this.api.put('/activities/read-all');
    return response.data;
  }

  // New season detection methods
  async getNewSeasonData() {
    const response = await this.api.get('/users/new-season-data');
    return response.data;
  }

  async updateNewSeasonData(data: any) {
    const response = await this.api.put('/users/new-season-data', data);
    return response.data;
  }

  // Episode methods
  async updateSpecificEpisode(
    seriesId: string | number,
    seasonIndex: number,
    episodeIndex: number,
    updates: any
  ) {
    const response = await this.api.put(
      `/series/${seriesId}/seasons/${seasonIndex}/episodes/${episodeIndex}`,
      updates
    );
    return response.data;
  }

  // Watchlist methods
  async getWatchlistOrder() {
    const response = await this.api.get('/users/watchlist-order');
    return response.data;
  }

  async updateWatchlistOrder(order: string[]) {
    const response = await this.api.put('/users/watchlist-order', { order });
    return response.data;
  }

  async checkUsernameAvailability(username: string) {
    const response = await this.api.get(`/users/check-username/${username}`);
    return response.data.available;
  }

  // Season management methods
  async updateSeasonWatched(seriesId: string, seasonNumber: number, watched: boolean) {
    const response = await this.api.put(`/series/${seriesId}/seasons/${seasonNumber}/watched`, {
      watched,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
