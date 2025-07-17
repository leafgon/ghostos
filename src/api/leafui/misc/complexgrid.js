import React from 'react';
import { Box, Grid, Paper, Typography, ButtonBase } from '@mui/material';

export default function LEAFUIComplexGrid(props) {
    const { _leafjs, appprops } = props;

    if (!_leafjs) return <div />;

    const tagrectcoord = _leafjs.render.tagrectcoord;
    const tagrectsize = _leafjs.render.tagrectsize;

    return (
          <Box
            id="bg-tag-center"
            sx={{
                      zIndex: 0,
                        position: 'absolute',
                        top: tagrectcoord.y,
                        left: tagrectcoord.x,
                      }}
          >
            <Box
              sx={{
                          width: tagrectsize.width,
                            zIndex: 0,
                            position: 'absolute',
                            top: 35,
                            left: 0,
                            flexGrow: 1,
                          }}
            >
              <Paper
                sx={{
                              p: 2,
                                margin: 'auto',
                                maxWidth: 500,
                              }}
              >
                <Grid container spacing={2}>
                  <Grid item>
                    <ButtonBase
                      sx={{
                                          width: 128,
                                            height: 128,
                                          }}
                    >
                      <Box
                        component="img"
                        src="/static/images/grid/complex.jpg"
                        alt="complex"
                        sx={{
                                              margin: 'auto',
                                                display: 'block',
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                              }}
                      />
                    </ButtonBase>
                  </Grid>
                  <Grid item xs={12} sm container>
                    <Grid item xs container direction="column" spacing={2}>
                      <Grid item xs>
                        <Typography gutterBottom variant="subtitle1">
                          Standard license
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Full resolution 1920x1080 • JPEG
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: 1030114
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography variant="body2" sx={{ cursor: 'pointer' }}>
                          Remove
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item>
                      <Typography variant="subtitle1">$19.00</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Box>
        );
}
