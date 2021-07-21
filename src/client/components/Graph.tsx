import React from 'react';
import { ethers } from "ethers";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import COMPOUND_DAI_ABI from '../contracts/compound_dai.json';
import {COMPOUND_DAI_ADDRESS, AAVE_LENDINGPOOL_ADDRESS, DAI_TOKEN_ADDRESS, ETHEREUM_AVG_BLOCKTIME} from '../constants'
import {calculateAPYCompound, calculateAPYDai} from '../utils/index.ts'
const LendingPoolV2Artifact = require('@aave/protocol-v2/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json');
import '../style/graph.css'

export class Graph extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      blockNumbers: [],
      compoundHistorical: [],
      aaveHistorical: [],
      currentBlock: null,
      graphData: []
    };

  }

  componentDidMount(){
    this.initialize();
  }

  async initialize(){
    this.intializeEthers();
    this.getHistorical();
  }

  async intializeEthers(){
    this.provider = new ethers.providers.JsonRpcProvider("https://eth.coincircle.com");
    this.compoundDaiContract = new ethers.Contract(COMPOUND_DAI_ADDRESS, COMPOUND_DAI_ABI, this.provider);
    this.aaveLendingContract = new ethers.Contract(AAVE_LENDINGPOOL_ADDRESS, LendingPoolV2Artifact.abi, this.provider);
  }

  async getHistorical(){
    const currentBlock = await this.provider.getBlockNumber();

    // get all the historical data from the last 128 blocks
    for(let lastBlock = currentBlock - 127 ; lastBlock < currentBlock ; lastBlock++){
      // calculate APY for Compound
      let nextRate = await this.compoundDaiContract.supplyRatePerBlock({blockTag: lastBlock}).then(result => {
        return result;
      });
      let supplyRate = await nextRate.toNumber();
      let compApy = calculateAPYCompound(supplyRate)

      // calculate APY for Aave
      let lendingPoolQuery = await this.aaveLendingContract.getReserveData(DAI_TOKEN_ADDRESS,{blockTag: lastBlock}).then(result =>{
        return result;
      })
      let currentLiquidityRate = lendingPoolQuery.currentLiquidityRate;
      let aaveApy = calculateAPYDai(currentLiquidityRate);

      // set state in each update so graph updates
      this.setState({
          blockNumbers : [...this.state.blockNumbers, lastBlock],
          compoundHistorical : [...this.state.compoundHistorical, compApy],
          aaveHistorical : [...this.state.aaveHistorical, aaveApy],
          graphData: [...this.state.graphData, {name:lastBlock.toString(),"Compound APY":compApy, "AAVE APY" : aaveApy}],
          currentBlock: lastBlock
      })
    }

    // poll for new data as new blocks are mined
    setInterval(() => this.pollData(), ETHEREUM_AVG_BLOCKTIME)

  }

  async pollData(){
    const currentBlock = await this.provider.getBlockNumber();

    if(currentBlock != this.state.currentBlock){
      // need to loop in case the current block is more than 1 after the last block
      for(let lastBlock = this.state.currentBlock + 1 ; lastBlock <= currentBlock ; lastBlock++){
        // calculate APY for Compound
        let nextRate = await this.compoundDaiContract.supplyRatePerBlock({blockTag: lastBlock}).then(result => {
          return result;
        });
        let supplyRate = await nextRate.toNumber();
        let compApy = calculateAPYCompound(supplyRate)

        // calculate APY for Aave
        let lendingPoolQuery = await this.aaveLendingContract.getReserveData(DAI_TOKEN_ADDRESS,{blockTag: lastBlock}).then(result =>{
          return result;
        })
        let currentLiquidityRate = lendingPoolQuery.currentLiquidityRate;
        let aaveApy = calculateAPYDai(currentLiquidityRate);

        this.setState({
            blockNumbers : [...this.state.blockNumbers, lastBlock],
            compoundHistorical : [...this.state.compoundHistorical, compApy],
            aaveHistorical : [...this.state.aaveHistorical, aaveApy],
            graphData: [...this.state.graphData, {name:lastBlock.toString(),"Compound APY":compApy, "AAVE APY" : aaveApy}],
            currentBlock: lastBlock
        })
      }
    }
  }

  render(){

    return (
      <ResponsiveContainer width="80%" height="80%" className='graph-container'>
        <LineChart
          width={500}
          height={300}
          data={this.state.graphData}
          margin={{
            top: 5,
            right: 50,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" label={{ value: "Block #",position:"bottom"}}/>
          <YAxis dataKey="Compound APY" label={{ value: "APY", position:"left"}} domain={[0, 'auto']} />
          <Tooltip />
          <Legend align="right"/>
          <Line type="linear" dataKey="Compound APY" stroke="#82ca9d" dot={false}/>
          <Line type="linear" dataKey="AAVE APY" stroke="#8884d8" dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    )
  }
}
