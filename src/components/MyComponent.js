import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { styled } from '@mui/material/styles';

// Стилизованные компоненты (добавьте в начало файла)
const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  margin: '16px 0',
  overflow: 'hidden',
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  '& .MuiCardHeader-title': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1a202c',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#2563eb',
  },
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 500,
}));

const StyledInput = styled('input')(({ theme }) => ({
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '1rem',
  width: '100%',
  '&:focus': {
    outline: 'none',
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
  },
}));

const StyledTable = styled('table')({
  width: '100%',
  borderCollapse: 'collapse',
  '& th, & td': {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
  },
  '& th': {
    backgroundColor: '#f8fafc',
    fontWeight: 600,
    textAlign: 'left',
  },
  '& tr:hover': {
    backgroundColor: '#f8fafc',
  },
});

const CFATradingSystem = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedTranche, setSelectedTranche] = useState(null);
  const [cfaAmount, setCfaAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState({
    money: 10000000,
    cfa: {
      senior: 0,
      mezzanine: 0,
      equity: 0
    }
  });

  const tranches = {
    senior: {
      name: 'Старший',
      percentage: 60,
      volume: 2100000000,
      yield: 0.4,
      reserve: 14000000 * 12,
      cashFlow: 8314166.67 * 12,
      cfaPrice: 1000,
      cfaAmount: 2100000,
      remainingLiquidity: 2100000000
    },
    mezzanine: {
      name: 'Мезонинный',
      percentage: 30,
      volume: 1050000000,
      yield: 0.7,
      reserve: 7000000 * 12,
      cashFlow: 7331666.67 * 12,
      cfaPrice: 1000,
      cfaAmount: 1050000,
      remainingLiquidity: 1050000000
    },
    equity: {
      name: 'Акционерный',
      percentage: 10,
      volume: 350000000,
      yield: 1.7,
      reserve: 2333333,
      cashFlow: 5979167.37,
      cfaPrice: 1000,
      cfaAmount: 350000,
      remainingLiquidity: 350000000
    }
  };

  // Оставьте все функции без изменений (handleTrancheSelect, validateTransaction, createBlock, updateBalances, handleTransaction)
  const handleTrancheSelect = (tranche) => {
    setSelectedTranche(tranche);
    setError('');
  };

  const validateTransaction = (amount, isBuy = true) => {
    if (!amount || isNaN(amount) || amount <= 0) return false;
    if (amount % 1 !== 0) return false;
    
    const totalPrice = amount * 1000;
    
    if (isBuy) {
      if (totalPrice > userBalance.money) return false;
      if (totalPrice > selectedTranche.remainingLiquidity) return false;
    } else {
      const trancheKey = Object.keys(tranches).find(key => 
        tranches[key].name === selectedTranche.name
      );
      if (amount > userBalance.cfa[trancheKey]) return false;
    }
    
    return true;
  };

  const createBlock = (transaction) => {
    const timestamp = new Date().toISOString();
    const blockNumber = blocks.length + 1;
    const trancheData = Object.values(tranches).find(t => t.name === transaction.tranche);
    
    return {
      blockNumber,
      timestamp,
      trancheName: transaction.tranche,
      cfaAmount: transaction.amount,
      totalPrice: transaction.price,
      type: transaction.type,
      remainingLiquidity: transaction.remainingLiquidity,
      yield: trancheData.yield,
      cashFlow: (trancheData.cashFlow / trancheData.cfaAmount) * transaction.amount
    };
  };

  const updateBalances = (transaction) => {
    const trancheKey = Object.keys(tranches).find(key => 
      tranches[key].name === transaction.tranche
    );
    
    setUserBalance(prev => {
      const newBalance = { ...prev };
      if (transaction.type === 'Покупка') {
        newBalance.money -= transaction.price;
        newBalance.cfa[trancheKey] += transaction.amount;
      } else {
        newBalance.money += transaction.price;
        newBalance.cfa[trancheKey] -= transaction.amount;
      }
      return newBalance;
    });
  };

  const handleTransaction = (isBuy = true) => {
    const amount = Number(cfaAmount);
    if (!validateTransaction(amount, isBuy)) {
      setError(isBuy ? 'Недостаточно средств или неверное количество ЦФА' : 'Недостаточно ЦФА для продажи');
      return;
    }

    const totalPrice = amount * 1000;
    const transaction = {
      timestamp: new Date().toISOString(),
      type: isBuy ? 'Покупка' : 'Продажа',
      tranche: selectedTranche.name,
      amount: amount,
      price: totalPrice,
      remainingLiquidity: isBuy ? 
        selectedTranche.remainingLiquidity - totalPrice :
        selectedTranche.remainingLiquidity + totalPrice
    };

    const newBlock = createBlock(transaction);
    setBlocks(prev => [...prev, newBlock]);
    setTransactions(prev => [...prev, transaction]);
    updateBalances(transaction);

    const trancheKey = Object.keys(tranches).find(key => 
      tranches[key].name === selectedTranche.name
    );
    tranches[trancheKey].remainingLiquidity = transaction.remainingLiquidity;

    setCfaAmount('');
    setError('');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const randomTranche = Object.values(tranches)[Math.floor(Math.random() * 3)];
      const randomAmount = Math.floor(Math.random() * 100) + 1;
      const isBuy = Math.random() > 0.5;
      
      const autoTransaction = {
        timestamp: new Date().toISOString(),
        type: isBuy ? 'Покупка' : 'Продажа',
        tranche: randomTranche.name,
        amount: randomAmount,
        price: randomAmount * 1000,
        remainingLiquidity: isBuy ? 
          randomTranche.remainingLiquidity - (randomAmount * 1000) :
          randomTranche.remainingLiquidity + (randomAmount * 1000)
      };

      setBlocks(prev => [...prev, createBlock(autoTransaction)]);
      setTransactions(prev => [...prev, autoTransaction]);
      
      const trancheKey = Object.keys(tranches).find(key => 
        tranches[key].name === randomTranche.name
      );
      tranches[trancheKey].remainingLiquidity = autoTransaction.remainingLiquidity;
    }, 5000);

    return () => clearInterval(interval);
  }, [blocks]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Баланс пользователя */}
      <StyledCard>
        <StyledCardHeader title="Баланс пользователя" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-800 mb-2">Денежные средства</div>
              <div className="text-2xl font-bold text-blue-600">
                {userBalance.money.toLocaleString()} ₽
              </div>
            </div>
            <div className="p-6 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-800 mb-2">Портфель ЦФА</div>
              {Object.entries(userBalance.cfa).map(([tranche, amount]) => (
                <div key={tranche} className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{tranches[tranche].name}:</span>
                  <span className="font-semibold text-green-600">{amount} шт.</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </StyledCard>

      {/* Торговый интерфейс */}
      <StyledCard>
        <StyledCardHeader title="Система торговли ЦФА" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.values(tranches).map(tranche => (
              <StyledButton
                key={tranche.name}
                onClick={() => handleTrancheSelect(tranche)}
                variant={selectedTranche?.name === tranche.name ? "contained" : "outlined"}
                fullWidth
              >
                <div className="text-left">
                  <div className="font-semibold">{tranche.name}</div>
                  <div className="text-sm opacity-80">
                    {tranche.remainingLiquidity.toLocaleString()} ₽
                  </div>
                </div>
              </StyledButton>
            ))}
          </div>

          {selectedTranche && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StyledInput
                  type="number"
                  value={cfaAmount}
                  onChange={(e) => setCfaAmount(e.target.value)}
                  placeholder="Количество ЦФА"
                  min="1"
                  step="1"
                />
                <StyledButton onClick={() => handleTransaction(true)}>
                  Купить
                </StyledButton>
                <StyledButton onClick={() => handleTransaction(false)}>
                  Продать
                </StyledButton>
              </div>
              {error && (
                <Alert severity="error" className="rounded-lg">
                  {error}
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </StyledCard>

      {/* График */}
      <StyledCard>
        <StyledCardHeader title="График транзакций" />
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={blocks}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="blockNumber" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalPrice"
                name="Сумма сделки"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cfaAmount"
                name="Количество ЦФА"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </StyledCard>

      {/* Блоки транзакций */}
      <StyledCard>
        <StyledCardHeader title="Блоки транзакций" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocks.slice(-6).reverse().map(block => (
              <StyledCard key={block.blockNumber}>
                <CardContent>
                  <h3 className="font-bold text-lg mb-2">Блок #{block.blockNumber}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Время:</span>
                      <span>{new Date(block.timestamp).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Тип:</span>
                      <span>{block.type}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Транш:</span>
                      <span>{block.trancheName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Количество ЦФА:</span>
                      <span>{block.cfaAmount}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Сумма:</span>
                      <span>{block.totalPrice.toLocaleString()} ₽</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Доходность:</span>
                      <span>{(block.yield * 100).toFixed(2)}%</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Денежный поток:</span>
                      <span>{block.cashFlow.toLocaleString()} ₽</span>
                    </p>
                  </div>
                </CardContent>
              </StyledCard>
            ))}
          </div>
        </CardContent>
      </StyledCard>

      {/* Реестр транзакций */}
      <StyledCard>
        <StyledCardHeader title="Реестр транзакций" />
        <CardContent>
          <div className="overflow-x-auto">
            <StyledTable>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Тип</th>
                  <th>Транш</th>
                  <th className="text-right">Количество ЦФА</th>
                  <th className="text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(-10).reverse().map((tx, index) => (
                  <tr key={index}>
                    <td>{new Date(tx.timestamp).toLocaleString()}</td>
                    <td>{tx.type}</td>
                    <td>{tx.tranche}</td>
                    <td className="text-right">{tx.amount}</td>
                    <td className="text-right">{tx.price.toLocaleString()} ₽</td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </div>
        </CardContent>
      </StyledCard>
    </div>
  );
};

export default CFATradingSystem;