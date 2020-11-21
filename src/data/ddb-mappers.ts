import {MapperForType, StringAttribute} from '@shiftcoders/dynamo-easy';
import {decode} from '../common/utils';
import {UUID} from 'io-ts-types/lib/UUID';

export const uuidMapper: MapperForType<UUID, StringAttribute> = {
    fromDb: (attributeValue: StringAttribute) => decode(attributeValue.S, UUID),
    toDb: (propertyValue: UUID) => ({S: UUID.encode(propertyValue)}),
};