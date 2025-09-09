import {
  NumberFormatter,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from '@mantine/core';

import type { RouterOutputs } from '@eboto/api';

export default function VoterStat({
  voterFieldStat,
}: {
  voterFieldStat: RouterOutputs['election']['getVoterFieldsStats'][number];
}) {
  return (
    <Table withColumnBorders withTableBorder>
      <TableThead>
        <TableTr>
          <TableTh>{voterFieldStat.name}</TableTh>
          <TableTh>Voted</TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>
        {voterFieldStat.options.length ? (
          voterFieldStat.options
            .sort((a, b) => b.vote_count - a.vote_count)
            .map((option) => (
              <TableTr key={option.name}>
                <TableTd>
                  {option.name.length ? option.name : 'No answer yet...'}
                </TableTd>
                <TableTd>
                  <NumberFormatter
                    thousandSeparator
                    value={option.vote_count}
                  />
                </TableTd>
              </TableTr>
            ))
        ) : (
          <TableTr>
            <TableTd>
              <Text>No answer yet</Text>
            </TableTd>
          </TableTr>
        )}
      </TableTbody>
    </Table>
  );
}
