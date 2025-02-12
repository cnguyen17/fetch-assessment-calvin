import React, { useState, useEffect } from 'react';
import { Layout, Row, Card, Select, Button, Pagination, message, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getBreeds, searchDogs, getDogs, logoutUser } from '../../services/api';
import { Dog } from '../../types/types';
import DogCard from '../../components/DogCard/DogCard';
import './Search.css';

const { Header, Content } = Layout;
const { Option } = Select;

const Search: React.FC = () => {
    const navigate = useNavigate();
    const [breeds, setBreeds] = useState<string[]>([]);
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const pageSize = 20;

    useEffect(() => {
        fetchBreeds();
        fetchDogs();
    }, []);

    const fetchBreeds = async () => {
        try {
            const response = await getBreeds();
            setBreeds(response.data);
        } catch (error) {
            message.error('Failed to fetch breeds');
        }
    };

    const fetchDogs = async (page = 1) => {
        try {
            setLoading(true);
            const searchResponse = await searchDogs({
                breeds: selectedBreeds,
                size: pageSize,
                from: ((page - 1) * pageSize).toString(),
                sort: 'breed:asc'
            });

            const dogsResponse = await getDogs(searchResponse.data.resultIds);
            setDogs(dogsResponse.data);
            setTotal(searchResponse.data.total);
            setCurrentPage(page);
        } catch (error) {
            message.error('Failed to fetch dogs');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
        } catch (error) {
            message.error('Failed to logout');
        }
    };

    const toggleFavorite = (dogId: string) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(dogId)) {
            newFavorites.delete(dogId);
        } else {
            newFavorites.add(dogId);
        }
        setFavorites(newFavorites);
    };

    return (
        <Layout>
            <Header className="search-header">
                <h1 className="search-title">Dog Finder</h1>
                <Space>
                    <Button 
                        type="primary" 
                        onClick={() => {/* Handle match generation */}}
                        disabled={favorites.size === 0}
                    >
                        Generate Match ({favorites.size})
                    </Button>
                    <Button 
                        icon={<LogoutOutlined />} 
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Space>
            </Header>
            <Content className="search-content">
                <Card className="breed-filter-card">
                    <Select
                        mode="multiple"
                        className="breed-select"
                        placeholder="Select breeds"
                        value={selectedBreeds}
                        onChange={(values: string[]) => {
                            setSelectedBreeds(values);
                            fetchDogs(1);
                        }}
                    >
                        {breeds.map((breed: string) => (
                            <Option key={breed} value={breed}>{breed}</Option>
                        ))}
                    </Select>
                </Card>

                <Row gutter={[16, 16]}>
                    {dogs.map(dog => (
                        <DogCard
                            key={dog.id}
                            dog={dog}
                            isFavorite={favorites.has(dog.id)}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))}
                </Row>

                <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    onChange={(page) => fetchDogs(page)}
                    className="pagination"
                />
            </Content>
        </Layout>
    );
};

export default Search; 