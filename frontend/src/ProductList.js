import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import './App.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Dropdown from 'react-bootstrap/Dropdown';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Pagination from 'react-bootstrap/Pagination';
// import Pagination from 'react-bootstrap/Pagination';
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend , CategoryScale, LinearScale, BarElement, Title);

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const APIENDPOINT = "http://localhost:5000/api/";
  // const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [totalSales, setTotalSales] = useState({});
  const [productStats, setproductStats] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [selectedMonthNumber, setSelectedMonthNumber] = useState(3); 
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const resultsPerPage = 10;

  const months = [
    { name: 'January', number: 1 },
    { name: 'February', number: 2 },
    { name: 'March', number: 3 },
    { name: 'April', number: 4 },
    { name: 'May', number: 5 },
    { name: 'June', number: 6 },
    { name: 'July', number: 7 },
    { name: 'August', number: 8 },
    { name: 'September', number: 9 },
    { name: 'October', number: 10 },
    { name: 'November', number: 11 },
    { name: 'December', number: 12 }
  ];

  const handleSelect = async (monthNumber, monthName) => {
    setSelectedMonth(monthName);
    setSelectedMonthNumber(monthNumber);
    console.log(`Selected month: ${monthName}, month number: ${monthNumber}`);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${APIENDPOINT}products`,{params: {search:query,month: selectedMonthNumber, page:currentPage, limit:resultsPerPage}}); 
      setProducts(response.data?.products);
      setTotalResults(response.data?.total);
      setTotalPages(response.data?.totalPages);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSummary = async () => {
    try {
      // setLoading(true);
      const response = await axios.get(`${APIENDPOINT}products-summary`,{params: {month: selectedMonthNumber}});
      // console.log(response.data);
      setCategories(response.data?.categories);
      setTotalSales(response.data?.totalSales);
      setproductStats(response.data?.productStats);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedMonthNumber,query,currentPage]);

  useEffect(() => {
    fetchProductSummary();
  }, [selectedMonthNumber]);

  const category_data = {
    labels: categories.map((category) => category._id),
    datasets: [
      {
        // label: "# of Items",
        data: categories.map((category) => category.count),
        backgroundColor: ["#0093E9","#9ACD32","#FFCE56","#FF6384","#36A2EB"],
        hoverBackgroundColor: ["#0093E9","#9ACD32","#FFCE56","#FF6384", "#36A2EB"],
      },
    ],
  };

  const bar_data = {
    labels: Object.keys(totalSales), 
    datasets: [
      {
        label: "Total Sales",
        data: Object.values(totalSales),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const bar_options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (<div className='App loading'>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>);
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Failed to fetch products.</Alert.Heading>
      </Alert>
    );
  }

  return (
    <Container>
      <Row className='HeadApp'>
        <Col>
          <h2>
            Transctions Dashboard
          </h2>
        </Col>
        <Col className='HeadApp-Col'>
        <Dropdown className="d-inline" autoClose="inside">
        <Dropdown.Toggle id="dropdown-autoclose-inside">
          {selectedMonth || "Select Month"} {/* Display selected month */}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {months.map((month, index) => (
            <Dropdown.Item 
              key={index} 
              onClick={() => handleSelect(month.number, month.name)}>
              {month.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
        </Col>
      </Row>
      <hr/>
      <Row>
      <Col>
        <Card >
          <Card.Body className='ProductSummary'>
            <h2>Total Sale</h2>
            <h2>{productStats?.totalSalesAmount ?? 0}</h2>
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card>
          <Card.Body className='ProductSummary'>
            <h2>Total Sold Item</h2>
            <h2>{productStats?.totalSoldItems ?? 0}</h2>            
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card >
          <Card.Body className='ProductSummary'>
            <h2>Total Not Sold Item</h2>
            <h2>{productStats?.totalNotSoldItems ?? 0}</h2>  
          </Card.Body>
        </Card>
      </Col>
      </Row>
      <hr/>
      <Row>
      <Col>
        <Card style={{ maxWidth: 800,maxHeight: 800, margin: "0 auto" }}>
          <Card.Body>
            <h2>Category Distribution</h2>
            <div style={{ height: "300px", width: "300px", margin: "0 auto" }}>
              <Pie data={category_data} height={200} width={200}/>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card style={{ maxWidth: 800,maxHeight: 800, margin: "0 auto" }}>
          <Card.Body>
            <h2>Total Sales Distribution</h2>
            <Bar data={bar_data} options={bar_options} />
          </Card.Body>
        </Card>
      </Col>
      </Row>
      <hr/>
      <Row className='ProductApp'>
        <Col>
        <Card className='ProductCard'>
          <Card.Body>
            <Row>
            <Col>
              <h2>
                Transctions Table
              </h2>
            </Col>
            <Col className='HeadApp-Col search-container'>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1); // Reset to the first page on new search
              }}
            />
            </Col>
            </Row>
            <hr/>
          <Table responsive="sm" striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Title</th>
            {/* <th>Description</th> */}
            <th>Price</th>
            <th>Category</th>
            {/* <th>Sold</th> */}
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {
            products && products.map((item) =>(
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.title}</td>
              {/* <td >{item.description}</td> */}
              <td>{item.price}</td>
              <td>{item.category}</td>
              {/* <td>{item.sold ?? "True"}</td> */}
              <td><img alt="" src={item.image} width="50px"/></td>
            </tr>
            ))
          }
        </tbody>
      </Table>
      <Row>
        <Col>
        <p>Total Records : {totalResults}</p>
        </Col>
        <Col>
        <Pagination size="sm" className="justify-content-end mt-3">
        <Pagination.First           
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1} />
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1} 
        />
          {Array.from({ length: totalPages }, (_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages} 
        />
          <Pagination.Last 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages} 
          />
        </Pagination>
        </Col>
      </Row>
          </Card.Body>
        </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductList;