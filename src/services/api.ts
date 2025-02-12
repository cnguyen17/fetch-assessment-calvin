import axios from 'axios';
import { 
    Dog, 
    Match, 
    Location, 
    LocationSearchParams, 
    LocationSearchResponse,
    SearchResponse 
} from '../types/types';

const BASE_URL = 'https://frontend-take-home-service.fetch.com';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const loginUser = async (name: string, email: string) => {
    return api.post('/auth/login', { name, email });
};

export const logoutUser = async () => {
    return api.post('/auth/logout');
};

export const getBreeds = async () => {
    return api.get<string[]>('/dogs/breeds');
};

export const searchDogs = async (params: {
    breeds?: string[];
    zipCodes?: string[];
    ageMin?: number;
    ageMax?: number;
    size?: number;
    from?: string;
    sort?: string;
}) => {
    return api.get('/dogs/search', { params });
};

export const getDogs = async (dogIds: string[]) => {
    return api.post<Dog[]>('/dogs', dogIds);
};

export const getMatch = async (dogIds: string[]) => {
    return api.post<Match>('/dogs/match', dogIds);
};

export const getLocations = async (zipCodes: string[]) => {
    return api.post<Location[]>('/locations', zipCodes);
};

export const searchLocations = async (params: LocationSearchParams) => {
    return api.post<LocationSearchResponse>('/locations/search', params);
}; 