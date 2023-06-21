import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { Suspense, useState } from 'react';
import { Link as RouterLink, useLoaderData, json, defer, Await } from 'react-router-dom';
// @mui
import {
  Card,
  Table,
  Stack,
  Paper,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
// components
import Scrollbar from '../components/scrollbar';
// sections
import { JobLogListHead, JobLogListToolbar } from '../sections/@dashboard/joblog';
// service
import { getRequestLogs } from '../services/requestlog';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'no', label: 'No', alignRight: false },
  { id: 'studentId', label: 'StudentId', alignRight: false },
  { id: 'method', label: 'Method', alignRight: false },
  { id: 'url', label: 'URL', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'timestamp', label: 'Timestamp', alignRight: false },
  { id: 'responeTime', label: 'Respone Time', alignRight: false },
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (_user) => _user.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function RequestLogPage() {
  const { data } = useLoaderData();
  const { requestLogs } = data;
  
  //Local states

  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('asc');

  const [selected, setSelected] = useState([]);

  const [orderBy, setOrderBy] = useState('name');

  const [filterName, setFilterName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(5);


  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = requestLogs.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - requestLogs.length) : 0;

  const filteredJobLog = applySortFilter(requestLogs, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredJobLog.length && !!filterName;

  return (
    <>
      <Helmet>
        <title> Job Log Result </title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Request Log Result
          </Typography>
          <Button
            component={RouterLink}
            to={`/dashboard/settings`}
            variant="contained"
            size="medium"
            color="secondary"
            startIcon={<ManageAccountsIcon />}
          >
            Settings
          </Button>
        </Stack>

        <Card>
          <JobLogListToolbar numSelected={selected.length} filterName={filterName} onFilterName={handleFilterByName} />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <JobLogListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={requestLogs.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  <Suspense fallback={<p style={{ textAlign: 'center' }}>Loading...</p>}>
                    <Await resolve={requestLogs}>
                      {(loadedLogJobs) => {
                        const slicedLogJobs = loadedLogJobs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

                        return (
                          <>
                            {slicedLogJobs.map((row, index) => {
                              const no = page * rowsPerPage + index + 1;
                              const { studentId, method, url, status, timestamp, reponseTime } = row;
                              const selectedLogJob = selected.indexOf(studentId) !== -1;

                              return (
                                <TableRow hover key={studentId} tabIndex={-1} role="checkbox" selected={selectedLogJob}>
                                  <TableCell align="left">{no}</TableCell>

                                  <TableCell component="th" scope="row" padding="none">
                                    <Stack direction="row" alignItems="center" marginLeft={2} spacing={2}>
                                      <Typography variant="subtitle2" noWrap>
                                        {studentId}
                                      </Typography>
                                    </Stack>
                                  </TableCell>

                                  <TableCell align="center">{method}</TableCell>

                                  <TableCell align="left">{url}</TableCell>

                                  <TableCell align="center">{status}</TableCell>

                                  <TableCell align="left">{timestamp.toString()}</TableCell>

                                  <TableCell align="center">{reponseTime} ms</TableCell>
                                </TableRow>
                              );
                            })}
                            {emptyRows > 0 && (
                              <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                              </TableRow>
                            )}
                          </>
                        );
                      }}
                    </Await>
                  </Suspense>
                </TableBody>

                {isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>

                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>&quot;{filterName}&quot;</strong>.
                            <br /> Try checking for typos or using complete words.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={requestLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </>
  );
}
async function loadRequestLogs() {
  const response = await getRequestLogs();

  if (response.status === 401 || response.status === 400 || response.status === 422) {
    return response;
  }

  if (!response.ok) {
    throw json(
      { message: 'Could not fetch students.' },
      {
        status: 500,
      }
    );
  }

  const resData = await response.json();
  console.log(resData.data);
  return resData.data;
}

export async function loader() {
  return defer({
    data: await loadRequestLogs(),
  });
}