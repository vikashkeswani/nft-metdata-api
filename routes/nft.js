const express = require('express');
const Web3 = require('web3');
const NFT = require('../models/nft');
require('dotenv').config();

const router = express.Router();
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

// ABI for the ERC721 Metadata interface
const ERC721_METADATA_ABI = [
    { "constant": true, "inputs": [{ "name": "_tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "name": "", "type": "string" }], "type": "function" }
];

// Utility function to fetch metadata
const fetchMetadata = async (tokenURI) => {
    const response = await fetch(tokenURI);
    if (!response.ok) throw new Error('Failed to fetch metadata');
    return response.json();
};

// Endpoint to fetch and store metadata
router.post('/fetch-metadata', async (req, res) => {
    const { contractAddress, tokenId } = req.body;

    if (!contractAddress || !tokenId) {
        return res.status(400).json({ error: 'Contract address and token ID are required.' });
    }

    try {
        // Check if the metadata is already stored in MongoDB
        let nft = await NFT.findOne({ contractAddress, tokenId });
        if (nft) {
            return res.status(200).json(nft);
        }

        // Fetch tokenURI from the blockchain
        const contract = new web3.eth.Contract(ERC721_METADATA_ABI, contractAddress);
        const tokenURI = await contract.methods.tokenURI(tokenId).call();

        // Fetch metadata from the tokenURI
        const metadata = await fetchMetadata(tokenURI);

        // Store the metadata in MongoDB
        nft = new NFT({
            contractAddress,
            tokenId,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
        });
        await nft.save();

        return res.status(200).json(nft);
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        return res.status(500).json({ error: 'Failed to fetch metadata.' });
    }
});

module.exports = router;
