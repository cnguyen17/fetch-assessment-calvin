import React, { useState, useEffect } from 'react';
import { Layout, Row, Card, Select, Button, Pagination, message, Space, Modal, Drawer } from 'antd';
import { LogoutOutlined, SearchOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getBreeds, searchDogs, getDogs, logoutUser, getMatch, searchLocations } from '../../services/api';
import { Dog, Location } from '../../types/types';
import DogCard from '../../components/DogCard/DogCard';
import FetchLogo from '../../assets/Fetch-logo-white.png';
import './Search.css';
import useMediaQuery from '../../hooks/useMediaQuery';

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
    const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [searchingLocations, setSearchingLocations] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        fetchBreeds();
        fetchDogs();
        handleLocationSearch('');
    }, []);

    const fetchBreeds = async () => {
        try {
            const response = await getBreeds();
            setBreeds(response.data);
        } catch (error) {
            message.error('Failed to fetch breeds');
        }
    };

    const handleLocationSearch = async (searchText: string) => {
        try {
            setSearchingLocations(true);
            const response = await searchLocations({
                city: searchText,
                size: 100,
                ...(searchText.trim() && { city: searchText })
            });
            setLocations(response.data.results);
        } catch (error) {
            message.error('Failed to search locations');
        } finally {
            setSearchingLocations(false);
        }
    };

    const handleDropdownVisibleChange = (open: boolean) => {
        if (open && locations.length === 0) {
            handleLocationSearch('');
        }
    };

    const fetchDogs = async (page = currentPage, size = pageSize) => {
        try {
            setLoading(true);
            const searchResponse = await searchDogs({
                breeds: selectedBreeds,
                zipCodes: selectedZipCodes,
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

    const handleSearch = () => {
        fetchDogs(1); // Reset to first page and fetch with current filters
    };

    const handleBreedChange = (values: string[]) => {
        setSelectedBreeds(values);
        // Remove the fetchDogs call here
    };

    const handleLocationChange = (values: string[]) => {
        setSelectedZipCodes(values);
        // Remove the fetchDogs call here
    };

    return (
        <Layout>
            <Header className="search-header">
                <div className="header-left">
                    <img src={FetchLogo} alt="Fetch Logo" className="fetch-logo" />
                    {!isMobile && <h1 className="search-title">Dog Finder</h1>}
                </div>
                <Space>
                    <Button 
                        className="match-button"
                        type="primary" 
                        onClick={handleGenerateMatch}
                        disabled={favorites.size === 0}
                        loading={isGeneratingMatch}
                    >
                        {favorites.size === 0 
                            ? "Select Dogs" 
                            : `Generate Match! (${favorites.size})`
                        }
                    </Button>
                    <Button 
                        className="logout-button"
                        icon={<LogoutOutlined />} 
                        onClick={handleLogout}
                    >
                        {!isMobile && "Logout"}
                    </Button>
                </Space>
            </Header>
            <Content className="search-content">
                {isMobile && (
                    <Button
                        icon={<MenuOutlined />}
                        onClick={() => setIsDrawerVisible(true)}
                        className="filter-menu-button"
                    >
                        Filters
                    </Button>
                )}
                {!isMobile ? (
                    <Card className="filter-card">
                        <div className="filters">
                            <div className="filter-section">
                                <h3>Breed Filter</h3>
                                <Select
                                    mode="multiple"
                                    className="breed-select"
                                    placeholder="Select breeds"
                                    value={selectedBreeds}
                                    onChange={handleBreedChange}
                                    allowClear
                                >
                                    {breeds.map((breed: string) => (
                                        <Option key={breed} value={breed}>{breed}</Option>
                                    ))}
                                </Select>
                            </div>

                            <div className="filter-section">
                                <h3>Location Filter</h3>
                                <Select
                                    mode="multiple"
                                    className="location-select"
                                    placeholder="Search and select locations"
                                    value={selectedZipCodes}
                                    onChange={handleLocationChange}
                                    onSearch={handleLocationSearch}
                                    onDropdownVisibleChange={handleDropdownVisibleChange}
                                    showSearch
                                    filterOption={false}
                                    loading={searchingLocations}
                                    allowClear
                                    options={locations
                                        .sort((a, b) => a.city.localeCompare(b.city))
                                        .map(location => ({
                                            label: `${location.city}, ${location.state} (${location.zip_code})`,
                                            value: location.zip_code
                                        }))}
                                    notFoundContent={searchingLocations ? 'Searching...' : 'No locations found'}
                                />
                            </div>

                            <div className="filter-section search-button-container">
                                <Button 
                                    type="primary" 
                                    icon={<SearchOutlined />}
                                    onClick={handleSearch}
                                    size="large"
                                    className="search-button"
                                >
                                    Search
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Drawer
                        title="Filters"
                        placement="left"
                        onClose={() => setIsDrawerVisible(false)}
                        open={isDrawerVisible}
                        className="filter-drawer"
                    >
                        <div className="filter-section">
                            <h3>Breed Filter</h3>
                            <Select
                                mode="multiple"
                                className="breed-select"
                                placeholder="Select breeds"
                                value={selectedBreeds}
                                onChange={handleBreedChange}
                                allowClear
                            >
                                {breeds.map((breed: string) => (
                                    <Option key={breed} value={breed}>{breed}</Option>
                                ))}
                            </Select>
                        </div>

                        <div className="filter-section">
                            <h3>Location Filter</h3>
                            <Select
                                mode="multiple"
                                className="location-select"
                                placeholder="Search and select locations"
                                value={selectedZipCodes}
                                onChange={handleLocationChange}
                                onSearch={handleLocationSearch}
                                onDropdownVisibleChange={handleDropdownVisibleChange}
                                showSearch
                                filterOption={false}
                                loading={searchingLocations}
                                allowClear
                                options={locations
                                    .sort((a, b) => a.city.localeCompare(b.city))
                                    .map(location => ({
                                        label: `${location.city}, ${location.state} (${location.zip_code})`,
                                        value: location.zip_code
                                    }))}
                                notFoundContent={searchingLocations ? 'Searching...' : 'No locations found'}
                            />
                        </div>

                        <Button 
                            type="primary" 
                            icon={<SearchOutlined />}
                            onClick={() => {
                                handleSearch();
                                setIsDrawerVisible(false);
                            }}
                            className="search-button-mobile"
                        >
                            Search
                        </Button>
                    </Drawer>
                )}

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
                        <div className="matched-dog-details">
                            <div className="matched-dog-detail">
                                <p><strong>Breed</strong></p>
                                <p>{matchedDog.breed}</p>
                            </div>
                            <div className="matched-dog-detail">
                                <p><strong>Age</strong></p>
                                <p>{matchedDog.age}</p>
                            </div>
                            <div className="matched-dog-detail">
                                <p><strong>Location</strong></p>
                                <p>{matchedDog.zip_code}</p>
                            </div>
                        </div>
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