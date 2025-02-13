import React, { useState, useEffect } from 'react';
import { Layout, Row, Card, Select, Button, Pagination, message, Space, Modal } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getBreeds, searchDogs, getDogs, logoutUser, getMatch } from '../../services/api';
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
    const [pageSize, setPageSize] = useState(20);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [matchedDog, setMatchedDog] = useState<Dog | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isGeneratingMatch, setIsGeneratingMatch] = useState(false);

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

    const fetchDogs = async (page = currentPage, size = pageSize) => {
        try {
            setLoading(true);
            const searchResponse = await searchDogs({
                breeds: selectedBreeds,
                size: size,
                from: ((page - 1) * size).toString(),
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

    const handlePageChange = (page: number, size?: number) => {
        const newSize = size || pageSize;
        if (size && size !== pageSize) {
            setPageSize(size);
            setCurrentPage(1); // Reset to first page when changing page size
            fetchDogs(1, size);
        } else {
            fetchDogs(page, newSize);
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

    const handleGenerateMatch = async () => {
        try {
            setIsGeneratingMatch(true);
            // Convert Set to Array for the API call
            const favoriteIds = Array.from(favorites);
            
            // Get the match ID
            const matchResponse = await getMatch(favoriteIds);
            const matchId = matchResponse.data.match;
            
            // Get the matched dog's details
            const matchedDogResponse = await getDogs([matchId]);
            setMatchedDog(matchedDogResponse.data[0]);
            setIsModalVisible(true);
        } catch (error) {
            message.error('Failed to generate match');
        } finally {
            setIsGeneratingMatch(false);
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setMatchedDog(null);
    };

    return (
        <Layout>
            <Header className="search-header">
                <h1 className="search-title">Dog Finder</h1>
                <Space>
                    <Button 
                        type="primary" 
                        onClick={handleGenerateMatch}
                        disabled={favorites.size === 0}
                        loading={isGeneratingMatch}
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
                    className="pagination"
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    pageSizeOptions={['10', '20', '50', '100']}
                />
            </Content>

            <Modal
                title="Your Perfect Match!"
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={[
                    <Button key="close" onClick={handleModalClose}>
                        Close
                    </Button>
                ]}
                width={600}
            >
                {matchedDog && (
                    <div className="matched-dog">
                        <img 
                            className="matched-dog-image"
                            src={matchedDog.img} 
                            alt={matchedDog.name}
                        />
                        <h2>{matchedDog.name}</h2>
                        <p><strong>Breed:</strong> {matchedDog.breed}</p>
                        <p><strong>Age:</strong> {matchedDog.age}</p>
                        <p><strong>Location:</strong> {matchedDog.zip_code}</p>
                        <p className="match-message">
                            Congratulations! You've been matched with {matchedDog.name}. 
                            This lovely {matchedDog.breed} would make a perfect addition to your family!
                        </p>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default Search; 