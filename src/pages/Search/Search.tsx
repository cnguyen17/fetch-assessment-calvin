import React, { useState, useEffect } from 'react';
import { Layout, Row, Card, Select, Button, Pagination, message, Space, Modal, Drawer } from 'antd';
import { LogoutOutlined, SearchOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getBreeds, searchDogs, getDogs, logoutUser, getMatch, searchLocations } from '../../services/api';
import { Dog, Location } from '../../types/types';
import DogCard from '../../components/DogCard/DogCard';
import FetchLogo from '../../assets/Fetch-logo-white.png';
import './Search.css';
import useMediaQuery from 'react-responsive';


const { Header, Content } = Layout;
const { Option } = Select;

const Search: React.FC = () => {
    const navigate = useNavigate();
    const [breeds, setBreeds] = useState<string[]>([]); // List of all available dog breeds
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]); // Selected breeds for filtering
    const [dogs, setDogs] = useState<Dog[]>([]); // List of dogs fetched based on filters
    const [loading, setLoading] = useState(false); // Loading state for API calls
    const [total, setTotal] = useState(0); // Total number of dogs available for the current search
    const [currentPage, setCurrentPage] = useState(1); // Current page in pagination
    const [pageSize, setPageSize] = useState(20); // Number of dogs displayed per page
    const [favorites, setFavorites] = useState<Set<string>>(new Set()); // Set of favorite dog IDs
    const [matchedDog, setMatchedDog] = useState<Dog | null>(null); // Dog matched for the user
    const [isModalVisible, setIsModalVisible] = useState(false);  // Visibility of the match modal
    const [isGeneratingMatch, setIsGeneratingMatch] = useState(false); 
    const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
    const [locations, setLocations] = useState<Location[]>([]); // List of locations fetched based on search
    const [searchingLocations, setSearchingLocations] = useState(false); 
    const [isDrawerVisible, setIsDrawerVisible] = useState(false); // Visibility of the filters drawer on mobile
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    
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

    // Search for locations
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

    // Trigger location search when the dropdown is opened and no locations are loaded
    const handleDropdownVisibleChange = (open: boolean) => {
        if (open && locations.length === 0) {
            handleLocationSearch('');
        }
    };

    // Fetch dogs based on the current filters (breeds, zip codes, pagination)
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

    // Handle pagination changes 
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

    // Logout the user and redirect to the login page
    const handleLogout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
        } catch (error) {
            message.error('Failed to logout');
        }
    };

    // Toggle a dog's favorite status
    const toggleFavorite = (dogId: string) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(dogId)) {
            newFavorites.delete(dogId);
        } else {
            newFavorites.add(dogId);
        }
        setFavorites(newFavorites);
    };

    // Generate a match 
    const handleGenerateMatch = async () => {
        try {
            setIsGeneratingMatch(true);
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

    // Make modal invisible
    const handleModalClose = () => {
        setIsModalVisible(false);
        setMatchedDog(null);
    };

    // reset search 
    const handleSearch = () => {
        fetchDogs(1); 
    };

    // Update selected breeds when the breed filter changes
    const handleBreedChange = (values: string[]) => {
        setSelectedBreeds(values);
    };

    
    const handleLocationChange = (values: string[]) => {
        setSelectedZipCodes(values);
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