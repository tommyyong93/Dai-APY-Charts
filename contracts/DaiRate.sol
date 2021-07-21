// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/*
 * @title Compound's CErc20Delegator Contract
 * @author Compound
 */
interface CErc20Delegator{

    function supplyRatePerBlock() external view returns (uint);

}

/*
 * @title LendingPoolAddressesProvider contract
 * @author Aave
 */
interface LendingPool{

    function getReserveData(address _reserve)
        external
        view
        returns (
            uint256 totalLiquidity,
            uint256 availableLiquidity,
            uint256 totalBorrowsStable,
            uint256 totalBorrowsVariable,
            uint256 liquidityRate,
            uint256 variableBorrowRate,
            uint256 stableBorrowRate,
            uint256 averageStableBorrowRate,
            uint256 utilizationRate,
            uint256 liquidityIndex,
            uint256 variableBorrowIndex,
            address aTokenAddress,
            uint40 lastUpdateTimestamp
        );
}

 /*
 * @title DaiRate
 * @author Tommy Yong
 */
contract DaiRate {

    CErc20Delegator compound = CErc20Delegator(0xbc689667C13FB2a04f09272753760E38a95B998C);
    LendingPool aave = LendingPool(0x9E5C7835E4b13368fd628196C4f1c6cEc89673Fa);

    /*
    * @dev returns Compound's protocol DAI lending apy on Ropsten
    * @return apy
    */
    function getCompoundRate() private view returns(uint apy){
        uint rate = compound.supplyRatePerBlock(); // Integer
        uint ethMantissa = 1e18; // (ETH has 18 decimal places)
        uint blocksPerDay = 6570; // (13.15 seconds per block)
        uint daysPerYear = 365;
        apy = ((((rate / ethMantissa * blocksPerDay + 1) ^ daysPerYear)) - 1) * 100;
    }

    /*
    * @dev returns Aave's protocol DAI lending apy on Ropsten
    * @return apy
    */
    function getAaveRate() private view returns(uint apy){
        uint ray = 1e27 ; // A Ray is a unit with 27 decimals of precision
        uint supplyRate;
        address daiRopstenTokenAddress = 0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108;
        (,,,,supplyRate,,,,,,,,) = aave.getReserveData(daiRopstenTokenAddress);
        apy = 100 * supplyRate / ray;
    }

    /*
    * @dev returns a tuple represent Compound's and Aave's protocol DAI lending apy on Ropsten
    * @return compAPY, aaveAPY
    */
    function getRates() public view returns(uint compAPY, uint aaveAPY){
        compAPY =  getCompoundRate();
        aaveAPY = getAaveRate();
    }

}
