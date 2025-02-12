import React from 'react';
import { Card, Col } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Dog } from '../../types/types';
import './DogCard.css';

interface DogCardProps {
    dog: Dog;
    isFavorite: boolean;
    onToggleFavorite: (dogId: string) => void;
}

const DogCard: React.FC<DogCardProps> = ({ dog, isFavorite, onToggleFavorite }) => {
    return (
        <Col xs={24} sm={12} md={8} lg={6}>
            <Card
                className="dog-card"
                hoverable
                onClick={() => onToggleFavorite(dog.id)}
                cover={<img alt={dog.name} src={dog.img} className="dog-image" />}
                extra={
                    isFavorite 
                        ? <HeartFilled className="heart-icon favorite" />
                        : <HeartOutlined className="heart-icon" />
                }
                
            >
                <Card.Meta
                    title={dog.name}
                    description={
                        <>
                            <p>Breed: {dog.breed}</p>
                            <p>Age: {dog.age}</p>
                            <p>Location: {dog.zip_code}</p>
                        </>
                    }
                />
            </Card>
        </Col>
    );
};

export default DogCard; 