import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add the access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not try to refresh if the failed request was a login or refresh request itself
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/forgot-password') ||
        originalRequest.url?.includes('/auth/reset-password')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;

        // Save new tokens
        if (access_token) {
          localStorage.setItem('access_token', access_token);
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        }
        if (new_refresh_token) {
          localStorage.setItem('refresh_token', new_refresh_token);
        }

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Login failed";
    throw new Error(message);
  }
}

export async function forgotPassword(email: string) {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to send reset email";
    throw new Error(message);
  }
}

export async function resetPassword(password: string) {
  try {
    const response = await api.post('/auth/reset-password', { password });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to reset password";
    throw new Error(message);
  }
}

export async function getCategories() {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch categories";
    throw new Error(message);
  }
}

export async function getTopics() {
  try {
    const response = await api.get('/topics');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch topics";
    throw new Error(message);
  }
}

export async function updateUserTopics(topics: string[]) {
  try {
    const response = await api.patch('/users/me/topics', { topic_codes: topics });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to update topics";
    throw new Error(message);
  }
}

export async function getUserTopics() {
  try {
    const response = await api.get('/users/me/topics');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch user topics";
    throw new Error(message);
  }
}

export async function getPapers({
  topicCodes,
  q,
  title,
  author,
  page = 1,
  limit = 20,
}: {
  topicCodes?: string[];
  q?: string;
  title?: string;
  author?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      sort_by: 'published_at',
      order: 'desc',
    };
    if (topicCodes && topicCodes.length > 0) {
      params.topics = topicCodes.join(',');
    }
    if (q) params.q = q;
    if (title) params.title = title;
    if (author) params.author = author;
    const response = await api.get('/papers/es/search', { params });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch papers";
    throw new Error(message);
  }
}

export async function getPaperById(id: string) {
  try {
    const response = await api.get(`/papers/es/${id}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch paper details";
    throw new Error(message);
  }
}

export async function getFavoritePapers({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) {
  try {
    const response = await api.get('/users/me/favorites', {
      params: { page: String(page), limit: String(limit) },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch favorite papers";
    throw new Error(message);
  }
}

export async function getHistoryPapers({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) {
  try {
    const response = await api.get('/users/me/history', {
      params: { page: String(page), limit: String(limit) },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch history";
    throw new Error(message);
  }
}

export async function getDuplicatePapers({
  parentId,
  page = 1,
  limit = 20,
}: {
  parentId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (parentId) params.parentId = parentId;
    const response = await api.get('/papers/es/duplicates/list', { params });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch duplicate papers";
    throw new Error(message);
  }
}

export async function getRecommendedPapers(id: string) {
  try {
    const response = await api.get(`/papers/es/${id}/you-might-like`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch recommended papers";
    throw new Error(message);
  }
}

// ---------------- STATISTICS / LEADERBOARD MODULE ---------------- //

export async function getTopicVelocity(params?: { topics?: string, interval?: string }) {
  try {
    const response = await api.get('/statistics/dashboard/topic-velocity', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch topic velocity");
  }
}

export async function getKeywordsCloud(params?: { days?: number }) {
  try {
    const response = await api.get('/statistics/dashboard/keywords-cloud', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch keywords cloud");
  }
}

export async function getActivityHeatmap() {
  try {
    const response = await api.get('/statistics/dashboard/activity-heatmap');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch activity heatmap");
  }
}

export async function getTopicRace() {
  try {
    const response = await api.get('/statistics/dashboard/topic-race');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch topic race");
  }
}

export async function getTrendingPapers(params?: { timeframe?: string }) {
  try {
    const response = await api.get('/statistics/leaderboard/trending-papers', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch trending papers");
  }
}

export async function getTopAuthors(params?: { timeframe?: string }) {
  try {
    const response = await api.get('/statistics/leaderboard/top-authors', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch top authors");
  }
}

export async function getRisingTopics(params?: { timeframe?: string }) {
  try {
    const response = await api.get('/statistics/leaderboard/rising-topics', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch rising topics");
  }
}

// ---------------- HISTORY MODULE ---------------- //

export async function addHistoryPaper(id: string) {
  try {
    const response = await api.post(`/users/me/history/${id}`);
    return response.data;
  } catch (error: any) {
    // Silently handle history save errors as they shouldn't break the UI
    console.error("Failed to save history", error);
    return null;
  }
}

export async function addFavoritePaper(id: string) {
  try {
    const response = await api.post(`/users/me/favorites/${id}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to add favorite";
    throw new Error(message);
  }
}

export async function removeFavoritePaper(id: string) {
  try {
    const response = await api.delete(`/users/me/favorites/${id}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to remove favorite";
    throw new Error(message);
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch user profile";
    throw new Error(message);
  }
}

export default api;
