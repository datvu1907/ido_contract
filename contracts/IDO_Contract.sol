// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
contract IDO is ERC20, Ownable{
    using SafeMath for uint256;
    struct user{
        uint256 amount;
        uint256 userClaim;
    }
    
    mapping(address => user) listVesting;

    IERC20 public Token;
    uint256 public firstRelease;
    // uint256 public firstClaim;
    uint256 public starTime;
    uint256 public totalPeriods;
    uint256 public timePerPeriod;
    uint256 public cliff;
    uint256 public totalToken;
    uint256 SWAP_RATE = 1000; // 1 ether = 1000 token
    
    event JoinWhiteList(address indexed user, uint256 amount);
    event Vesting(address owner, uint256 amount);
    event Claim(address indexed user, uint256 amount, uint256 yearGoneBy, uint256 monthGoneBy);

    constructor() ERC20("Near Protocol", "NEAR2"){
        _mint(msg.sender, 2000 * 10**18);
        Token = IERC20(address(this));
        totalPeriods = 8;
        timePerPeriod = 1;
        cliff = 1;
        starTime = block.timestamp;
        totalToken = 2000;
    }

    function joinWhiteList(uint256 amount) public payable{
        require(amount <= 1000, "User can only claim 10,000 Token");
        require(totalToken > 0, "Sold out");


        // user pay ether for tokens
        payable(owner()).transfer((amount/SWAP_RATE) * 10**18); 
  
        
        listVesting[_msgSender()].amount = amount;
        listVesting[_msgSender()].userClaim = 0;
        totalToken.trySub(amount);
        emit JoinWhiteList(_msgSender(), amount);
    }

    function fundVesting() public onlyOwner{
        transfer(address(this), totalToken * 10**18);
        emit Vesting(_msgSender(), totalToken);
    }

    function claim() public  {
        uint256 YearsGoneBy = ((block.timestamp - starTime)/ 12);   // 1 year = 24 second for test
        uint256 MonthsGoneBy = ((block.timestamp - starTime)% 12);
        require(listVesting[_msgSender()].amount > 0, "You are not in vesting");
        require(listVesting[_msgSender()].userClaim <= listVesting[_msgSender()].amount, "You have claimed all");
        console.log("YearsGoneBy %s and MonthsGoneBuy ", YearsGoneBy, MonthsGoneBy);
        if( YearsGoneBy < 1){      /// first claim
            // check first claim of user 
        
            uint256 firstClaim = listVesting[_msgSender()].amount * 20/100;  
            require(listVesting[_msgSender()].userClaim < 200, "You have claimed in this year");

            Token.transfer(_msgSender(), firstClaim * 10**18);
            listVesting[_msgSender()].userClaim = listVesting[_msgSender()].amount * 20/100;
            emit Claim(_msgSender(), firstClaim, YearsGoneBy, MonthsGoneBy);
        }else{ // claim after cliff
        
            if(YearsGoneBy == 1 && MonthsGoneBy >= totalPeriods || YearsGoneBy >= 2){ 
             /**?
                Claim all for after period
                 */
            // Check if user have claim all
            require(listVesting[_msgSender()].userClaim < listVesting[_msgSender()].amount, "You have claimed all token");
            uint256 tokenLeft =  listVesting[_msgSender()].amount - listVesting[_msgSender()].userClaim;
            
            console.log("tokenLeft %s", tokenLeft);  
            Token.transfer(_msgSender(),  tokenLeft * 10**18);
            listVesting[_msgSender()].userClaim = listVesting[_msgSender()].amount;
            emit Claim(_msgSender(), tokenLeft, YearsGoneBy, MonthsGoneBy);

            }else{      
                /**?
                Claim for each period
                 */
            // total token in this month
            uint256 totalClaim = listVesting[_msgSender()].amount * 20/100 + listVesting[_msgSender()].amount* MonthsGoneBy * 10/100; 
            console.log("totalClaim %s", totalClaim);
            // total token that user can claim in this month
            uint256 thisMonthClaim =  totalClaim - listVesting[_msgSender()].userClaim;
        
            console.log("thisMonthClaim %s", thisMonthClaim);
            //check if user claim have claim in this month or not
            require(listVesting[_msgSender()].userClaim < totalClaim, "You have claimed in this month"); 

            
            Token.transfer(_msgSender(), thisMonthClaim * 10**18);
            listVesting[_msgSender()].userClaim += thisMonthClaim;
            console.log("userClaim %s", listVesting[_msgSender()].userClaim);
            emit Claim(_msgSender(), thisMonthClaim, YearsGoneBy, MonthsGoneBy);

            }
           
        }
       
    }
}