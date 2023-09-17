interface IEvent {
  schema: {
    type: string;
    fields: [
      {
        type: string;
        optional: boolean;
        field: string;
        name: string;
      }
    ];
    optional: boolean;
    name: string;
    field: string;
  };
}

interface ICustomerEvent extends IEvent {
  payload: {
    before: {
      id: any;
      first_name: string;
      last_name: string;
      email: string;
    };
    after: {
      id: any;
      first_name: string;
      last_name: string;
      email: string;
    };
    source: any;
  };
}

export { type ICustomerEvent };
