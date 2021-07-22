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
      currentBlock: 0,
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
    // fetch all data from the database
    fetch('http://localhost:3001/rates',{
      method: "GET"
    }).then(res => res.json()).then(data => {
      for(let i = 0; i < data.length ; i++){
        // need to format datetime object from the database
        let date = new Date(data[i].timestamp * 1000);
        const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
        const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
        const formattedDate = year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":" + seconds;
        this.setState({
          graphData: [...this.state.graphData, {name:formattedDate,"Compound APY":data[i].compound_rate, "Aave APY" : data[i].aave_rate}],
          currentBlock: data[i].block_number
        })
      }
    })

    let lastBlockInDataBase = this.state.currentBlock;
    let currentBlock = await this.provider.getBlockNumber();

    // we can only poll 128 blocks back from within the current block
    if(currentBlock - lastBlockInDataBase >= 128){
      lastBlockInDataBase = currentBlock - 127;
    }
    else{
      lastBlockInDataBase = currentBlock - lastBlockInDataBase;
    }

    // get all the historical data
    for(let lastBlock = lastBlockInDataBase ; lastBlock <= currentBlock ; lastBlock++){
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

      // get time stamp
      let block = await this.provider.getBlock(lastBlock);
      let timestamp = block.timestamp;
      // block timestamp is in seconds Date accepts arguments in milliseconds
      let date = new Date(timestamp * 1000);
      const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
      const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
      const formattedDate = year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":" + seconds;

      // set state in each update so graph updates
      this.setState({
          graphData: [...this.state.graphData, {name:formattedDate,"Compound APY":compApy, "Aave APY" : aaveApy}],
          currentBlock: lastBlock
      })

      // populate database
      fetch('http://localhost:3001/rates',{
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({"blockNumber" : lastBlock, "timeStamp" : timestamp, "compApy" : compApy, "aaveApy": aaveApy})
      }).catch(err => console.log(err))

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

        // get time stamp
        let block = await this.provider.getBlock(lastBlock);
        let timestamp = block.timestamp;
        // block timestamp is in seconds Date accepts arguments in milliseconds
        let date = new Date(timestamp * 1000);
        const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
        const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
        const formattedDate = year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":" + seconds;

        // set component state
        this.setState({
            graphData: [...this.state.graphData, {name:formattedDate,"Compound APY":compApy, "Aave APY" : aaveApy}],
            currentBlock: lastBlock
        })

        // populate database
        fetch('http://localhost:3001/rates',{
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({"blockNumber" : lastBlock, "timeStamp" : timestamp, "compApy" : compApy, "aaveApy": aaveApy})
        }).catch(err => console.log(err))
      }
    }
  }

  render(){

    return (
        <ResponsiveContainer width="85%" height="80%" className='graph-container'>
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
            <XAxis dataKey="name" label={{ value: "Date",position:"bottom"}}/>
            <YAxis dataKey="Compound APY" label={{ value: "APY", position:"left"}} domain={[0, 'auto']} />
            <Tooltip />
            <Legend align="right"/>
            <Line type="linear" dataKey="Compound APY" stroke="#82ca9d" dot={true} strokeWidth={2}/>
            <Line type="linear" dataKey="Aave APY" stroke="#8884d8" dot={true} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
    )
  }
}
