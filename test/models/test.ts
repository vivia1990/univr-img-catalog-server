/* interface BaseHighLightsRes {
    id: number;
    manager_rank: number;
    player_name: string;
    entry_name: string;
  }

type KeysOfType<TRecord extends Record<any, any>, TargetType> = {
    [K in keyof TRecord]: TRecord[K] extends TargetType ? K : never
  };

export const sortHighlight = <T extends BaseHighLightsRes>(
    array: T[],
    firstCriteria: KeysOfType<T, number>,
    secondCriteria: KeysOfType<T, number> = 'manager_rank'
): void => {
    array.sort(
        (a, b) =>
            b[firstCriteria] - a[firstCriteria] || a[secondCriteria] - b[secondCriteria]

    );
};

// okay
sortHighlight([{
    entry_name: 'fsdf',
    id: 123,
    manager_rank: 123,
    player_name: 'fsdf'
}], 'id', 'manager_rank');

// error! second arg is not assignable
sortHighlight([{
    entry_name: 'fsdf',
    id: 123,
    manager_rank: 123,
    player_name: 'fsdf'
}], 'player_name', 'manager_rank');
 */
