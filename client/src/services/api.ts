import axios from "axios";
import { Images } from "lucide-react";

const API_BASE_URL = 'https://sih-hackthon-g8l7.onrender.com/api';


class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'content-type':'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,

      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'citizen' | 'official';
  }) {
    return this.request<{
      message: string;
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        civicScore: number;
        verified: boolean;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append("email", JSON.stringify(email));
    formData.append("password", JSON.stringify(password));
    return this.request<{
      message: string;
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        civicScore: number;
        verified: boolean;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password})
    });
  }

  async getProfile() {
    return this.request<{
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        civicScore: number;
        verified: boolean;
      };
    }>('/auth/profile');
  }

  // Issue methods
  async createIssue(issueData: {
    title: string;
    description: string;
    category: string;
    location: string;
    address?: string;
    images?: object[];
  }) {
    const formData = new FormData();
    
    formData.append("title", issueData.title);
    formData.append("description", issueData.description);
    formData.append("category", issueData.category);
    formData.append("location", issueData.location);
    formData.append("address", issueData.address);
    for (const image of issueData.images) {
      formData.append("images", image); 
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('https://sih-hackthon-g8l7.onrender.com/api/issues',formData,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      console.log("Upload Successfull",res);
    } catch (error) {
      console.error("error", error);
    }
  //   return this.request<{
  //     message: string;
  //     issue: any;
  //   }>('/issues', {
  //     method: 'POST',
  //     body: formData,
  //   }
  // );
  }

  async getIssues(page: number = 1, limit: number = 10) {
    return this.request<{
      issues: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/issues?page=${page}&limit=${limit}`);
  }

  async getMyIssues() {
    return this.request<{
      issues: any[];
    }>('/issues/my-issues');
  }

  async getIssue(id: string) {
    return this.request<{
      issue: any;
    }>(`/issues/${id}`);
  }

  async updateIssueStatus(id: string, status: string, assignedTo?: string) {
    return this.request<{
      message: string;
      issue: any;
    }>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, assignedTo }),
    });
  }

  async addComment(issueId: string, text: string) {
    return this.request<{
      message: string;
      issue: any;
    }>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async upvoteIssue(issueId: string) {
    return this.request<{
      message: string;
      upvotes: number;
    }>(`/issues/${issueId}/upvote`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{
      message: string;
      status: string;
    }>('/health');
  }
}


export const apiService = new ApiService();
export default apiService;